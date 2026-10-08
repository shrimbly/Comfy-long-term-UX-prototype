<!-- Implements: Homestead PRD P0.7/P0.9 agent status, repair and explicit readiness. -->
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
</script>
<template>
  <div class="space-y-4">
    <ol
      v-if="s.build.phase === 'building' || s.build.phase === 'ready'"
      class="space-y-4"
      :aria-label="t('homestead.buildProgress')"
    >
      <li
        v-for="step in [0, 1, 2, 3]"
        :key="step"
        class="flex items-center gap-3 text-sm"
      >
        <i
          :class="
            cn(
              'size-4 shrink-0',
              s.build.phase === 'ready' ||
                (s.build.phase === 'building' && s.build.step > step)
                ? 'icon-[lucide--circle-check] text-jade-400'
                : s.build.phase === 'building' && s.build.step === step
                  ? 'icon-[lucide--loader-circle] animate-spin text-azure-300'
                  : 'icon-[lucide--circle] text-muted-foreground'
            )
          "
        />
        <span
          :class="
            cn(
              s.build.phase === 'building' &&
                s.build.step < step &&
                'text-muted-foreground'
            )
          "
          >{{ t(`homestead.buildStep${step}`) }}</span
        >
      </li>
    </ol>
    <div
      v-if="s.build.phase === 'ready'"
      class="rounded-xl border border-jade-400/25 bg-jade-400/5 p-4"
      role="status"
    >
      <p class="font-medium">
        {{
          t(
            s.buildSurface === 'manager'
              ? 'homestead.cloudBuildReady'
              : 'homestead.buildReady'
          )
        }}
      </p>
      <p class="mt-2 text-xs leading-5 text-muted-foreground">
        {{
          t(
            s.buildSurface === 'manager'
              ? 'homestead.cloudSwitchBody'
              : 'homestead.buildReadyBody'
          )
        }}
      </p>
      <p v-if="s.updateEnvironment" class="mt-2 text-sm">
        {{ s.updateEnvironment.name }} · {{ s.updateEnvironment.revision }}
      </p>
      <Button class="mt-4" variant="inverted" @click="s.openBuilt()"
        ><i class="icon-[lucide--external-link] size-4" />{{
          t(
            s.buildSurface === 'manager'
              ? 'homestead.switchNewBuild'
              : 'homestead.openUI'
          )
        }}</Button
      >
    </div>
    <div v-if="s.build.phase === 'failed'" class="space-y-3" role="alert">
      <p class="font-medium text-gold-400">{{ t('homestead.buildFailed') }}</p>
      <p class="text-xs leading-5 text-muted-foreground">
        {{ t('homestead.buildFailedBody') }}
      </p>
      <pre
        class="overflow-auto rounded-lg bg-base-background p-3 text-xs leading-5 whitespace-pre-wrap"
        >{{ s.build.log }}</pre>
      <Button @click="s.dialog = 'logs'">{{ t('homestead.logs') }}</Button
      ><Button
        class="ml-2"
        variant="primary"
        @click="
          () => {
            if (s.buildSurface === 'manager') s.repairCloudBuild()
            else s.retryBuild()
          }
        "
        >{{
          t(
            s.buildSurface === 'manager'
              ? 'homestead.fixWithAgent'
              : 'homestead.retryAgent'
          )
        }}</Button
      >
    </div>
    <p class="text-xs leading-5 text-muted-foreground">
      {{ t('homestead.workingVersion') }}
    </p>
  </div>
</template>
