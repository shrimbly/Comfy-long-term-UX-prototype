<!-- Implements: Homestead PRD Desktop/import handoffs, environment selection, safe updates and V2/V3 concepts. -->
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import { compatibility, projectScan } from './model'
import { useHomesteadStore } from './store'
import HomesteadBuild from './HomesteadBuild.vue'
import HomesteadDesktopForm from './HomesteadDesktopForm.vue'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
function editEnvironment() {
  if (s.version === 1) s.editBuildFor(s.environment.id)
  else {
    s.dialog = null
    usePrototypeCustomNodesStore().open()
  }
}
const s = useHomesteadStore()
const { t } = useI18n()
const titles = {
  outOfMemory: 'outOfMemoryTitle',
  nodesInfo: 'nodesInfoTitle',
  desktop: 'desktopTitle',
  import: 'importTitle',
  environment: 'selectEnvironment',
  manager: 'managerTitle',
  platform: 'platformTitle',
  local: 'localTitle',
  logs: 'logsTitle',
  update: 'updateAvailable'
}
const descriptions = {
  outOfMemory: 'outOfMemoryBody',
  nodesInfo: 'nodesInfoBody',
  desktop: 'desktopBody',
  import: 'importBody',
  environment: 'compatibilityNote',
  manager: 'managerBody',
  platform: 'platformBody',
  local: 'localOnly',
  logs: 'buildFailedBody',
  update: 'updateBody'
}
const pending = computed(() =>
  s.availableEnvironments.find((e) => e.id === s.pendingEnvironmentId)
)
const scan = computed(() =>
  pending.value ? projectScan(s.projectWorkflows, pending.value) : []
)
const choices = computed(() =>
  s.availableEnvironments.filter(
    (e) => s.dialog !== 'import' || s.importCase !== 'unknown' || !e.verified
  )
)
const needsBuild = computed(
  () =>
    !choices.value.some(
      (env) => compatibility(s.active, env).status === 'compatible'
    )
)
const packs = [
  {
    name: 'Impact Pack 8.8',
    description: 'Detection, segmentation and detail enhancement'
  },
  {
    name: 'WAS Suite 1.0',
    description: 'Image processing and finishing utilities'
  },
  {
    name: 'Studio Matte Tools 0.3',
    description: 'Studio matte extraction and edge refinement'
  }
]
async function copy() {
  try {
    await navigator.clipboard.writeText(s.prompt)
    s.flash(t('homestead.copied'))
  } catch {
    s.flash(t('homestead.copyFailed'))
  }
}
function choose(id: string) {
  const importing = s.dialog === 'import'
  s.switchEnvironment(id)
  if (importing && s.version !== 3 && !s.dialog) {
    s.openWorkflow(s.activeId)
    return
  }
  if (s.dialog === 'import') return
  if (s.view !== 'canvas' && s.version !== 3) s.openWorkflow(s.activeId)
}
</script>
<template>
  <Dialog
    :open="!!s.dialog"
    @update:open="
      () => {
        s.dialog = null
        s.pendingEnvironmentId = null
      }
    "
  >
    <DialogPortal
      ><DialogOverlay /><DialogContent
        v-if="s.dialog"
        size="md"
        class="max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader
          ><DialogTitle>{{
            t(
              `homestead.${s.dialog === 'environment' && s.version === 3 ? 'selectProjectEnvironment' : titles[s.dialog]}`
            )
          }}</DialogTitle
          ><DialogClose
        /></DialogHeader>
        <div class="space-y-5 px-6 pb-6">
          <DialogDescription>{{
            t(`homestead.${descriptions[s.dialog]}`)
          }}</DialogDescription>
          <div v-if="s.dialog === 'nodesInfo'" class="space-y-5">
            <ol
              class="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground"
            >
              <li>{{ t('homestead.nodesInfoStep1') }}</li>
              <li>{{ t('homestead.nodesInfoStep2') }}</li>
              <li>{{ t('homestead.nodesInfoStep3') }}</li>
            </ol>
            <div class="flex justify-end">
              <Button variant="inverted" @click="s.dialog = null">{{
                t('homestead.gotIt')
              }}</Button>
            </div>
          </div>
          <div v-if="s.dialog === 'outOfMemory'" class="space-y-5">
            <div
              role="alert"
              class="flex items-start gap-3 rounded-lg border border-gold-400/25 bg-gold-400/5 p-4"
            >
              <i
                class="mt-0.5 icon-[lucide--triangle-alert] size-5 shrink-0 text-gold-400"
                aria-hidden="true"
              />
              <div class="space-y-1">
                <p class="text-sm font-medium">
                  {{ t('homestead.outOfMemoryError') }}
                </p>
                <p class="text-xs text-muted-foreground">{{ s.active.name }}</p>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="muted-textonly" @click="s.dialog = null">{{
                t('homestead.keepEditing')
              }}</Button>
              <Button variant="inverted" @click="s.dialog = 'desktop'">
                <i class="icon-[lucide--cloud-upload] size-4" />{{
                  t('homestead.runOnComfyCloud')
                }}
              </Button>
            </div>
          </div>
          <HomesteadDesktopForm v-if="s.dialog === 'desktop'" />
          <template v-if="s.dialog === 'import' || s.dialog === 'environment'">
            <div class="rounded-lg bg-secondary-background/50 p-3 text-sm">
              <span class="text-muted-foreground"
                >{{ t('homestead.workflow') }}:</span
              >
              {{ s.active.name }}
            </div>
            <template v-if="pending && s.version === 3">
              <div
                class="rounded-lg border border-gold-400/30 bg-gold-400/5 p-4"
              >
                <p class="font-medium">{{ t('homestead.scanTitle') }}</p>
                <p class="mt-2 text-xs leading-5 text-muted-foreground">
                  {{ t('homestead.scanBody') }}
                </p>
              </div>
              <div
                v-for="row in scan"
                :key="row.workflow.id"
                class="flex items-start gap-3 border-b border-interface-stroke pb-3"
              >
                <i
                  :class="
                    cn(
                      'mt-0.5 size-4',
                      row.status === 'compatible'
                        ? 'icon-[lucide--circle-check] text-jade-400'
                        : 'icon-[lucide--triangle-alert] text-gold-400'
                    )
                  "
                />
                <div>
                  <p class="text-sm">{{ row.workflow.name }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ row.missing.join(', ') || t(`homestead.${row.status}`) }}
                  </p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ pending.name }} · {{ pending.revision }}
              </p>
              <div class="flex justify-end gap-2">
                <Button @click="s.pendingEnvironmentId = null">{{
                  t('homestead.cancel')
                }}</Button
                ><Button
                  variant="primary"
                  @click="s.switchEnvironment(pending.id, true)"
                  >{{ t('homestead.confirmSwitch') }}</Button
                >
              </div>
            </template>
            <template v-else>
              <p
                v-if="
                  s.dialog === 'import' &&
                  (s.importCase === 'unknown' || needsBuild)
                "
                class="rounded-lg bg-gold-400/10 p-3 text-xs leading-5 text-gold-400"
              >
                {{
                  t(
                    s.importCase === 'missing'
                      ? 'homestead.importMissing'
                      : 'homestead.importUnknown'
                  )
                }}
              </p>
              <div
                v-for="env in choices"
                :key="env.id"
                class="flex items-center gap-3 rounded-xl border border-interface-stroke p-4"
              >
                <i class="icon-[lucide--server] size-5 text-muted-foreground" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">
                    {{ env.name }}
                    <span class="ml-1 text-xs text-muted-foreground">{{
                      env.revision
                    }}</span>
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ env.gpu }}
                  </p>
                  <p
                    :class="
                      cn(
                        'mt-2 text-xs',
                        compatibility(s.active, env).status === 'compatible'
                          ? 'text-jade-400'
                          : 'text-gold-400'
                      )
                    "
                  >
                    {{ t(`homestead.${compatibility(s.active, env).status}`)
                    }}<span v-if="compatibility(s.active, env).missing.length">
                      ·
                      {{
                        compatibility(s.active, env).missing.join(', ')
                      }}</span
                    >
                  </p>
                </div>
                <Button
                  :disabled="
                    s.version !== 3 &&
                    compatibility(s.active, env).status !== 'compatible'
                  "
                  @click="choose(env.id)"
                  >{{ t('homestead.select') }}</Button
                >
              </div>
              <p class="text-xs leading-5 text-muted-foreground">
                {{
                  t(
                    s.version === 3
                      ? 'homestead.projectOnly'
                      : 'homestead.compatibleOnly'
                  )
                }}
              </p>
              <template v-if="s.dialog === 'import'"
                ><p class="text-xs text-muted-foreground">
                  {{ t('homestead.importSimulation') }}
                </p>
                <p class="text-xs leading-5 text-muted-foreground">
                  {{ t('homestead.localFile') }}
                </p>
                <details
                  class="rounded-lg border border-interface-stroke p-3 text-xs"
                >
                  <summary class="cursor-pointer">
                    {{ t('homestead.agentPrompt') }}
                  </summary>
                  <p class="mt-3 leading-5 select-text">{{ s.prompt }}</p>
                </details>
                <Button variant="inverted" @click="copy"
                  ><i class="icon-[lucide--copy] size-4" />{{
                    t('homestead.copy')
                  }}</Button
                ></template
              >
              <Button v-else variant="textonly" @click="editEnvironment">{{
                t('homestead.editBuild')
              }}</Button>
            </template>
          </template>
          <template v-if="s.dialog === 'manager' || s.dialog === 'platform'">
            <p v-if="s.dialog === 'manager'" class="text-xs text-gold-400">
              {{ t('homestead.concept') }}
            </p>
            <p v-else class="text-xs text-muted-foreground">
              {{ t('homestead.platformNote') }}
            </p>
            <div
              class="flex items-center gap-3 rounded-xl border border-interface-stroke p-4"
            >
              <i class="icon-[lucide--server] size-6 text-muted-foreground" />
              <div>
                <p class="font-medium">
                  {{
                    (s.dialog === 'platform'
                      ? s.buildEnvironment
                      : s.environment
                    ).name
                  }}
                  ·
                  {{
                    (s.dialog === 'platform'
                      ? s.buildEnvironment
                      : s.environment
                    ).revision
                  }}
                </p>
                <p class="mt-1 text-xs text-jade-400">
                  {{ t('homestead.workingVersion') }}
                </p>
              </div>
            </div>
            <template
              v-if="
                s.build.phase === 'idle' ||
                s.buildSurface !==
                  (s.dialog === 'manager' ? 'manager' : 'platform')
              "
            >
              <div v-if="s.dialog === 'manager'" class="space-y-3">
                <label
                  v-for="pack in packs"
                  :key="pack.name"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-interface-stroke p-3"
                  ><input
                    v-model="s.selectedPacks"
                    type="checkbox"
                    :value="pack.name"
                    :disabled="
                      s.environment.packs.includes(pack.name) ||
                      !s.editableBuild
                    "
                    class="size-4 accent-primary-background"
                  /><span class="flex-1"
                    ><span class="block text-sm">{{ pack.name }}</span
                    ><span class="mt-1 block text-xs text-muted-foreground">{{
                      pack.description
                    }}</span></span
                  ><span
                    v-if="s.environment.packs.includes(pack.name)"
                    class="text-xs text-muted-foreground"
                    >{{ t('homestead.installed') }}</span
                  ></label
                >
              </div>
              <div v-else class="space-y-3">
                <p class="text-xs text-muted-foreground">
                  {{ t('homestead.dependencies') }}
                </p>
                <p class="text-sm leading-6">
                  {{
                    [
                      ...new Set([...s.environment.packs, ...s.active.packs])
                    ].join(' · ')
                  }}
                </p>
                <label for="hs-idle" class="block text-xs">{{
                  t('homestead.idleLabel')
                }}</label
                ><input
                  id="hs-idle"
                  v-model.number="s.idleMinutes"
                  :disabled="!s.editableBuild"
                  type="number"
                  min="1"
                  max="60"
                  class="w-24 rounded-lg border border-interface-stroke bg-secondary-background p-2"
                  @change="
                    () => {
                      s.idleMinutes = Math.max(
                        1,
                        Math.min(60, s.idleMinutes || 3)
                      )
                      s.resetIdle()
                    }
                  "
                />
                <p class="text-xs text-muted-foreground">
                  {{ t('homestead.idleNote') }}
                </p>
              </div>
              <p
                v-if="!s.editableBuild"
                class="text-xs leading-5 text-gold-400"
              >
                {{ t('homestead.permission') }}
              </p>
              <Button
                variant="inverted"
                :disabled="
                  !s.editableBuild ||
                  (s.dialog === 'manager' && !s.selectedPacks.length) ||
                  s.build.phase === 'building'
                "
                @click="
                  s.startBuild(s.dialog === 'manager' ? 'manager' : 'platform')
                "
                >{{ t('homestead.buildDeploy') }}</Button
              >
            </template>
            <HomesteadBuild v-else />
            <div
              class="flex items-center gap-3 border-t border-interface-stroke pt-4"
            >
              <i
                class="icon-[lucide--code-xml] size-5 text-muted-foreground"
              /><span class="flex-1 text-xs">{{
                t('homestead.localTitle')
              }}</span
              ><Button variant="textonly" @click="s.dialog = 'local'">{{
                t('homestead.develop')
              }}</Button>
            </div>
          </template>
          <template v-if="s.dialog === 'local' || s.dialog === 'logs'">
            <p v-if="s.dialog === 'local'" class="text-sm leading-6">
              {{
                t(
                  s.version >= 2
                    ? 'homestead.localBodyV2'
                    : 'homestead.localBodyV1'
                )
              }}
            </p>
            <pre
              v-if="s.dialog === 'logs'"
              class="rounded-lg bg-secondary-background p-4 text-xs leading-5 whitespace-pre-wrap"
              >{{
                s.build.phase === 'failed'
                  ? s.build.log
                  : t('homestead.runtimeLog')
              }}</pre>
            <textarea
              readonly
              :value="s.prompt"
              :aria-label="t('homestead.agentPrompt')"
              rows="9"
              class="w-full resize-none rounded-xl border border-interface-stroke bg-base-background p-4 text-xs leading-5 select-text"
            />
            <Button variant="inverted" @click="copy"
              ><i class="icon-[lucide--copy] size-4" />{{
                t(s.dialog === 'logs' ? 'homestead.repair' : 'homestead.copy')
              }}</Button
            >
            <Button
              v-if="s.dialog === 'logs' && s.build.phase === 'failed'"
              class="ml-2"
              @click="
                () => {
                  if (s.buildSurface === 'manager') s.repairCloudBuild()
                  else s.retryBuild()
                }
              "
              >{{ t('homestead.retryAgent') }}</Button
            >
          </template>
          <template v-if="s.dialog === 'update'"
            ><div class="rounded-lg border border-interface-stroke p-4">
              <p class="font-medium">
                {{ s.updateEnvironment?.name }}
                {{ s.updateEnvironment?.revision }}
              </p>
              <p class="mt-2 text-xs leading-5 text-muted-foreground">
                {{ s.updateEnvironment?.packs.join(' · ') }}
              </p>
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="textonly" @click="s.dialog = null">{{
                t('homestead.keepCurrent')
              }}</Button
              ><Button
                variant="inverted"
                @click="
                  s.version === 3
                    ? ((s.dialog = 'environment'),
                      (s.pendingEnvironmentId =
                        s.updateEnvironment?.id ?? null))
                    : s.updateEnvironment &&
                      s.switchEnvironment(s.updateEnvironment.id)
                "
                >{{ t('homestead.switch') }}</Button
              >
            </div></template
          >
        </div>
      </DialogContent></DialogPortal
    >
  </Dialog>
</template>
