<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
import HomesteadDialog from './HomesteadDialog.vue'
import HomesteadBuild from './HomesteadBuild.vue'
import HomesteadAgent from './HomesteadAgent.vue'
const s = useHomesteadStore()
const { t } = useI18n()
</script>
<template>
  <aside
    v-if="s.agentOpen && s.allowed"
    class="flex w-100 max-w-full shrink-0 flex-col overflow-hidden border-l border-border-subtle bg-base-background text-base-foreground max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-40"
  >
    <div
      class="flex items-center justify-between border-b border-border-subtle p-3"
    >
      <span class="flex items-center gap-2 text-sm font-medium"
        ><i class="icon-[lucide--sparkles] size-4" />{{
          t(
            s.buildSurface === 'agent'
              ? 'homestead.agent'
              : 'homestead.buildProgress'
          )
        }}</span
      ><Button
        variant="muted-textonly"
        size="icon-sm"
        :aria-label="t('homestead.close')"
        @click="s.agentOpen = false"
        ><i class="icon-[lucide--x] size-4"
      /></Button>
    </div>
    <HomesteadAgent v-if="s.agentRun" />
    <div v-else class="space-y-5 overflow-auto p-4">
      <p class="text-sm text-muted-foreground">
        {{
          t(
            s.buildSurface === 'manager'
              ? 'homestead.cloudBuildIntro'
              : 'homestead.agentIntro'
          )
        }}
      </p>
      <HomesteadBuild />
      <details
        v-if="s.buildSurface !== 'manager'"
        class="rounded-lg border border-border-subtle p-3 text-xs"
      >
        <summary>{{ t('homestead.agentPrompt') }}</summary>
        <p class="mt-3 leading-5">{{ s.prompt }}</p>
      </details>
    </div>
  </aside>
  <div
    v-if="!s.allowed"
    class="absolute inset-0 z-40 grid place-items-center bg-base-background p-8 text-base-foreground"
  >
    <div class="max-w-md space-y-4 text-center">
      <i class="icon-[lucide--lock-keyhole] size-8 text-muted-foreground" />
      <h2 class="text-lg font-medium">
        {{
          t(
            s.access === 'signedout'
              ? 'homestead.signinTitle'
              : 'homestead.deniedTitle'
          )
        }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ t('homestead.deniedBody') }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ t('homestead.accessSimulation') }}
      </p>
    </div>
  </div>
  <div
    v-if="s.notice"
    role="status"
    class="absolute right-4 bottom-4 z-50 max-w-lg rounded-lg border border-border-default bg-base-background px-4 py-3 text-sm text-base-foreground shadow-lg"
  >
    {{ s.notice }}
  </div>
  <HomesteadDialog v-if="s.allowed" />
</template>
