<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent class="shadow-none" size="md">
        <DialogHeader>
          <DialogTitle>{{
            deployment?.name ?? t('prototype.environments.new')
          }}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <form class="flex min-h-0 flex-col" @submit.prevent="save">
          <div class="flex flex-col gap-5 overflow-y-auto px-6 py-4">
            <DialogDescription>{{
              t('prototype.environments.preview')
            }}</DialogDescription>
            <label class="flex flex-col gap-2 text-sm">
              {{ t('prototype.environments.name') }}
              <Input
                v-model="name"
                required
                :maxlength="80"
                :disabled="!editable"
              />
            </label>
            <template v-if="!deployment">
              <label class="flex flex-col gap-2 text-sm">
                {{ t('prototype.environments.build') }}
                <select
                  v-model="buildId"
                  class="h-10 rounded-lg border border-border-default bg-base-background px-3"
                >
                  <option
                    v-for="build in store.builds"
                    :key="build.id"
                    :value="build.id"
                  >
                    {{ build.name
                    }}{{ build.release ? ` · ${build.release}` : '' }}
                  </option>
                </select>
              </label>
              <label class="flex flex-col gap-2 text-sm">
                {{ t('prototype.environments.gpu') }}
                <select
                  v-model="gpu"
                  class="h-10 rounded-lg border border-border-default bg-base-background px-3"
                >
                  <option v-for="option in store.gpus" :key="option">
                    {{ option }}
                  </option>
                </select>
              </label>
            </template>
            <template v-else>
              <dl class="m-0 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt class="text-muted-foreground">
                    {{ t('prototype.environments.gpu') }}
                  </dt>
                  <dd class="mt-1 ml-0">{{ deployment.gpu }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">
                    {{ t('prototype.environments.build') }}
                  </dt>
                  <dd class="mt-1 ml-0">{{ deployment.release }}</dd>
                </div>
              </dl>
              <label class="flex flex-col gap-2 text-sm">
                {{ t('prototype.environments.warm') }}
                <Input
                  v-model="warmMinutes"
                  :aria-label="t('prototype.environments.warm')"
                  :aria-describedby="warmHintId"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  required
                  :disabled="!editable"
                />
                <span :id="warmHintId" class="text-xs text-muted-foreground">{{
                  t('prototype.environments.warmHint')
                }}</span>
              </label>
              <details class="border-t border-border-subtle pt-4 text-sm">
                <summary class="cursor-pointer">
                  {{ t('prototype.environments.contents') }}
                </summary>
                <div
                  class="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground"
                >
                  <div>
                    <p class="mt-0 font-medium text-base-foreground">
                      {{
                        t(
                          'prototype.environments.nodes',
                          deployment.nodePacks.length
                        )
                      }}
                    </p>
                    <p
                      v-for="pack in deployment.nodePacks"
                      :key="pack"
                      class="wrap-break-word"
                    >
                      {{ pack }}
                    </p>
                  </div>
                  <div>
                    <p class="mt-0 font-medium text-base-foreground">
                      {{
                        t(
                          'prototype.environments.models',
                          deployment.models.length
                        )
                      }}
                    </p>
                    <p
                      v-for="model in deployment.models"
                      :key="model"
                      class="wrap-break-word"
                    >
                      {{ model }}
                    </p>
                  </div>
                </div>
              </details>
              <div class="border-t border-border-subtle pt-4">
                <p class="mt-0 mb-2 text-sm">
                  {{ t('prototype.environments.usedBy') }}
                </p>
                <Button
                  v-for="project in projects"
                  :key="project.id"
                  variant="muted-textonly"
                  type="button"
                  class="w-full justify-start"
                  @click="openProject(project.id)"
                  >{{ project.name
                  }}<i class="ml-auto icon-[ph--arrow-right-bold] size-3.5"
                /></Button>
                <p
                  v-if="!projects.length"
                  class="m-0 text-xs text-muted-foreground"
                >
                  {{ t('prototype.environments.noProjects') }}
                </p>
              </div>
            </template>
            <p v-if="error" role="alert" class="m-0 text-sm text-error">
              {{ t('prototype.environments.invalid') }}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="muted-textonly"
              @click="emit('close')"
              >{{ t('g.close') }}</Button
            >
            <Button
              v-if="editable"
              type="submit"
              variant="secondary"
              :disabled="!name.trim()"
              >{{
                t(deployment ? 'g.save' : 'prototype.environments.create')
              }}</Button
            >
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import { COMFY_CLOUD } from '../fixtures/customCloud'
import { usePrototypeEnvironmentStore } from '../stores/environmentStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Deployment } from '../types'

const { deployment } = defineProps<{ deployment?: Deployment }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const store = usePrototypeEnvironmentStore()
const ui = usePrototypeUiStore()
const name = ref(deployment?.name ?? '')
const warmMinutes = ref<string | number>(deployment?.warmMinutes ?? 2)
const buildId = ref(COMFY_CLOUD.id)
const gpu = ref('RTX 4090')
const error = ref(false)
const warmHintId = useId()
const editable = computed(
  () => store.canManage && deployment?.status !== 'building'
)
const projects = computed(() =>
  store.projects.filter((project) => project.deploymentId === deployment?.id)
)

function save() {
  const saved = deployment
    ? store.update(deployment.id, name.value, Number(warmMinutes.value))
    : store.create(name.value, gpu.value, buildId.value)
  if (saved) emit('close')
  else error.value = true
}
function openProject(projectId: string) {
  ui.go({ kind: 'project', projectId })
  emit('close')
}
</script>
