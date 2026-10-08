<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@comfyorg/tailwind-utils'
import Button from '@/components/ui/button/Button.vue'
import { agentActivities } from './agentModel'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
const scroller = ref<HTMLElement | null>(null)
const following = ref(true)
const activities = computed(() =>
  s.agentRun ? agentActivities(s.agentRun).slice(0, s.agentStep + 1) : []
)
const running = computed(() => s.build.phase === 'building')
const failed = computed(() => s.build.phase === 'failed')
function onScroll() {
  const el = scroller.value
  if (el)
    following.value = el.scrollHeight - el.scrollTop - el.clientHeight < 100
}
watch(
  () => [s.agentStep, s.build.phase],
  async () => {
    if (!following.value) return
    await nextTick()
    scroller.value?.scrollTo({
      top: scroller.value.scrollHeight,
      behavior: 'instant'
    })
  }
)
async function copyUrl() {
  if (!s.agentUrl) return
  try {
    await navigator.clipboard.writeText(s.agentUrl)
    s.flash(t('homestead.copiedUrl'))
  } catch {
    s.flash(t('homestead.copyFailed'))
  }
}
</script>
<template>
  <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto" @scroll="onScroll">
    <div v-if="s.agentRun" class="space-y-6 px-4 py-5">
      <div
        class="flex items-center justify-between text-xs text-muted-foreground"
      >
        <span :title="t('homestead.agentSimulationHint')">{{
          t('homestead.agentSimulation')
        }}</span
        ><span role="status" aria-live="polite">{{
          t(
            running
              ? 'homestead.agentWorking'
              : failed
                ? 'homestead.agentFailed'
                : 'homestead.agentFinished'
          )
        }}</span>
      </div>
      <section class="ml-5 rounded-xl bg-secondary-background px-4 py-3">
        <p class="mb-2 text-xs font-medium text-muted-foreground">
          {{ t('homestead.you') }}
        </p>
        <p class="text-sm leading-6">
          {{
            t(
              s.agentRun.request.mode === 'create'
                ? 'homestead.createBuild'
                : 'homestead.updateBuild'
            )
          }}: <strong class="font-medium">{{ s.agentRun.request.name }}</strong>
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ s.agentRun.workflow.name }} · {{ s.agentRun.request.gpu }}
        </p>
        <p
          v-if="s.agentRun.request.instructions"
          class="mt-3 text-sm leading-5"
        >
          {{ s.agentRun.request.instructions }}
        </p>
        <details class="mt-3 text-xs">
          <summary class="cursor-pointer text-muted-foreground">
            {{ t('homestead.agentPrompt') }}
          </summary>
          <pre class="mt-3 font-sans leading-5 whitespace-pre-wrap">{{
            s.agentRun.prompt
          }}</pre>
        </details>
      </section>
      <div class="flex gap-3">
        <i class="mt-1 icon-[lucide--sparkles] size-4 shrink-0" />
        <p class="text-sm leading-6">{{ t('homestead.agentPlan') }}</p>
      </div>
      <div class="space-y-2" :aria-label="t('homestead.buildProgress')">
        <details
          v-for="(activity, index) in activities"
          :key="activity.key"
          :open="
            index === s.agentStep || (running && index === s.agentStep - 1)
          "
          class="group rounded-lg border border-border-subtle bg-secondary-background/15"
        >
          <summary
            class="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-xs"
          >
            <i
              :class="
                cn(
                  'size-3.5 shrink-0',
                  index === s.agentStep && running
                    ? 'icon-[lucide--loader-circle] animate-spin text-muted-foreground motion-reduce:animate-none'
                    : index === s.agentStep && failed
                      ? 'icon-[lucide--circle-alert] text-gold-400'
                      : 'icon-[lucide--check] text-muted-foreground'
                )
              "
            />
            <span class="flex-1 font-medium">{{
              t(`homestead.agentStep_${activity.key}`)
            }}</span>
            <i
              v-if="activity.kind === 'cli'"
              class="icon-[lucide--terminal] size-3.5 text-muted-foreground"
            /><i
              v-else-if="activity.kind === 'skill'"
              class="icon-[lucide--book-open] size-3.5 text-muted-foreground"
            /><i
              class="icon-[lucide--chevron-right] size-3 text-muted-foreground group-open:rotate-90"
            />
          </summary>
          <div class="border-t border-border-subtle">
            <div
              v-if="activity.input"
              class="flex gap-2 bg-secondary-background/40 px-3 py-2"
            >
              <span
                v-if="activity.kind === 'cli'"
                class="font-mono text-xs text-muted-foreground"
                aria-hidden="true"
                >$</span
              ><code
                class="min-w-0 text-xs leading-5 wrap-anywhere whitespace-pre-wrap"
                >{{ activity.input }}</code
              >
            </div>
            <pre
              class="overflow-x-auto px-3 py-3 font-mono text-xs leading-5 whitespace-pre-wrap text-muted-foreground"
              >{{
                index === s.agentStep && failed
                  ? t('homestead.agentFailedOutput')
                  : index === s.agentStep && running
                    ? activity.output.split('\n')[0]
                    : activity.output
              }}</pre>
            <p
              v-if="index === s.agentStep && running"
              class="flex items-center gap-2 px-3 pb-3 text-xs text-muted-foreground"
            >
              <span
                class="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
              />{{
                t(
                  activity.kind === 'thinking'
                    ? 'homestead.agentThinking'
                    : 'homestead.agentWorking'
                )
              }}
            </p>
          </div>
        </details>
      </div>
      <section
        v-if="s.agentUrl && s.updateEnvironment"
        class="space-y-3 border-t border-border-subtle pt-5"
      >
        <div class="flex items-center gap-2">
          <i class="icon-[lucide--circle-check] size-4 text-jade-400" />
          <p class="text-sm font-medium">{{ t('homestead.agentResult') }}</p>
        </div>
        <p class="text-sm leading-6 text-muted-foreground">
          {{
            t('homestead.agentResultBody', {
              name: s.updateEnvironment.name,
              revision: s.updateEnvironment.revision
            })
          }}
        </p>
        <a
          :href="s.agentUrl"
          class="block rounded-lg border border-border-default bg-secondary-background/30 p-3 font-mono text-xs leading-5 wrap-anywhere text-base-foreground underline decoration-muted-foreground underline-offset-4"
          @click.prevent="s.openBuilt()"
          >{{ s.agentUrl }}</a
        >
        <div class="flex gap-2">
          <Button variant="inverted" size="sm" @click="s.openBuilt()"
            >{{ t('homestead.openCloud')
            }}<i class="icon-[lucide--arrow-up-right] size-3.5" /></Button
          ><Button variant="secondary" size="sm" @click="copyUrl"
            ><i class="icon-[lucide--copy] size-3.5" />{{
              t('homestead.copyUrl')
            }}</Button
          >
        </div>
        <p
          v-if="s.agentRun.request.mode === 'update'"
          class="text-xs leading-5 text-muted-foreground"
        >
          {{ t('homestead.agentResultUpdate') }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t('homestead.agentLinkLocal') }}
        </p>
      </section>
      <section
        v-if="s.build.phase === 'failed'"
        class="space-y-3 border-t border-border-subtle pt-4"
        role="alert"
      >
        <p class="text-sm font-medium">{{ t('homestead.buildFailed') }}</p>
        <pre
          class="rounded-lg bg-secondary-background p-3 text-xs leading-5 whitespace-pre-wrap"
          >{{ s.build.log }}</pre>
        <Button variant="inverted" size="sm" @click="s.retryBuild()">{{
          t('homestead.agentRetry')
        }}</Button
        ><Button
          variant="muted-textonly"
          size="sm"
          @click="s.dialog = 'logs'"
          >{{ t('homestead.logs') }}</Button
        >
      </section>
    </div>
  </div>
</template>
