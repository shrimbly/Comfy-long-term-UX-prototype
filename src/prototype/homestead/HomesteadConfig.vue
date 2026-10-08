<!-- Implements: Homestead PRD version boundaries and prototype scenario controls. -->
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
function resetDemo() {
  s.reset()
  window.location.reload()
}
function scenario(kind: string) {
  if (kind === 'oom') {
    s.openWorkflow('matte', 'desktop')
    s.oom = true
  }
  if (kind === 'sleep' && !s.sleep()) s.flash(t('homestead.sleepBlocked'))
  if (kind === 'failure') {
    s.openWorkflow(s.activeId)
    s.entry = 'cloud'
    s.sleep()
    s.runtime = 'failed'
  }
  if (kind === 'update') {
    s.failure = 'none'
    s.dialog = 'platform'
    s.startBuild('platform')
  }
}
</script>
<template>
  <aside
    class="flex max-h-[75vh] w-80 flex-col overflow-y-auto rounded-xl bg-base-background text-base-foreground"
    :aria-label="t('homestead.config')"
  >
    <div
      class="flex items-center justify-between border-b border-interface-stroke px-5 py-4"
    >
      <span class="flex items-center gap-2 font-medium"
        ><i
          class="icon-[lucide--sliders-horizontal] size-4 text-muted-foreground"
        />{{ t('homestead.config') }}</span
      >
      <Button
        variant="muted-textonly"
        size="icon"
        :aria-label="t('homestead.close')"
        @click="s.configOpen = false"
        ><i class="icon-[lucide--x] size-4"
      /></Button>
    </div>
    <div class="space-y-6 p-5">
      <p class="text-xs leading-5 text-muted-foreground">
        {{ t('homestead.configDescription') }}
      </p>
      <section>
        <p class="mb-3 text-xs font-medium">{{ t('homestead.version') }}</p>
        <div
          class="flex gap-1 rounded-lg bg-base-background p-1"
          role="group"
          :aria-label="t('homestead.version')"
        >
          <Button
            v-for="v in [1, 2, 3] as const"
            :key="v"
            :variant="s.version === v ? 'inverted' : 'muted-textonly'"
            class="flex-1"
            :aria-pressed="s.version === v"
            @click="s.setVersion(v)"
            >{{ `V${v}` }}</Button
          >
        </div>
        <p class="mt-3 text-sm font-medium">
          {{ t(`homestead.v${s.version}`) }}
        </p>
        <p class="mt-1 text-xs leading-5 text-muted-foreground">
          {{ t(`homestead.v${s.version}Description`) }}
        </p>
        <p v-if="s.version > 1" class="mt-3 text-xs text-gold-400">
          {{ t('homestead.concept') }}
        </p>
      </section>
      <section class="space-y-3 border-t border-interface-stroke pt-5">
        <label for="hs-access" class="block text-xs font-medium">{{
          t('homestead.access')
        }}</label>
        <select
          id="hs-access"
          v-model="s.access"
          class="h-9 w-full rounded-lg bg-secondary-background px-3 text-xs focus-visible:outline-2 focus-visible:outline-primary-background"
        >
          <option
            v-for="role in ['admin', 'member', 'outsider', 'signedout']"
            :key="role"
            :value="role"
          >
            {{ t(`homestead.${role}`) }}
          </option>
        </select>
        <label for="hs-import" class="block pt-2 text-xs font-medium">{{
          t('homestead.importCase')
        }}</label>
        <select
          id="hs-import"
          v-model="s.importCase"
          class="h-9 w-full rounded-lg bg-secondary-background px-3 text-xs focus-visible:outline-2 focus-visible:outline-primary-background"
        >
          <option
            v-for="kind in ['compatible', 'missing', 'unknown']"
            :key="kind"
            :value="kind"
          >
            {{ t(`homestead.${kind}Case`) }}
          </option>
        </select>
        <p class="text-xs leading-5 text-muted-foreground">
          {{ t('homestead.coldStartSimulation') }}
        </p>
        <label for="hs-build" class="block pt-2 text-xs font-medium">{{
          t('homestead.buildResult')
        }}</label>
        <select
          id="hs-build"
          v-model="s.failure"
          class="h-9 w-full rounded-lg bg-secondary-background px-3 text-xs focus-visible:outline-2 focus-visible:outline-primary-background"
        >
          <option value="none">{{ t('homestead.none') }}</option>
          <option value="build">{{ t('homestead.buildFailure') }}</option>
          <option value="deployment">
            {{ t('homestead.deploymentFailure') }}
          </option>
        </select>
      </section>
      <section class="border-t border-interface-stroke pt-5">
        <p class="mb-3 text-xs font-medium">{{ t('homestead.scenarios') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <Button
            v-for="item in [
              { id: 'oom', key: 'oom' },
              { id: 'sleep', key: 'sleep' },
              { id: 'failure', key: 'startupFailure' },
              { id: 'update', key: 'updateScenario' }
            ]"
            :key="item.id"
            variant="secondary"
            class="h-auto min-h-10 text-left text-xs whitespace-normal"
            @click="scenario(item.id)"
            >{{ t(`homestead.${item.key}`) }}</Button
          >
        </div>
      </section>
      <section class="rounded-lg border border-interface-stroke p-3">
        <p class="text-xs font-medium">{{ t('homestead.scope') }}</p>
        <p class="mt-2 text-xs leading-5 text-muted-foreground">
          {{ t(`homestead.scope${s.version}`) }}
        </p>
      </section>
      <Button variant="muted-textonly" class="w-full" @click="resetDemo"
        ><i class="icon-[lucide--rotate-ccw] size-3.5" />{{
          t('homestead.reset')
        }}</Button
      >
      <a
        href="https://app.notion.com/p/3f16d73d3650819f894bed7f77313295"
        target="_blank"
        rel="noreferrer"
        class="block text-center text-xs text-muted-foreground hover:text-base-foreground"
        >{{ t('homestead.prd') }} ↗</a
      >
    </div>
    <div
      class="mt-auto border-t border-interface-stroke p-5 text-xs leading-5 text-muted-foreground"
    >
      <span
        :class="cn('mr-2 inline-block size-1.5 rounded-full bg-gold-400')"
      />{{ t('homestead.simulated') }}
    </div>
  </aside>
</template>
