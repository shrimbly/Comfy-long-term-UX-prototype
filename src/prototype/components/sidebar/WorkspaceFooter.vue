<template>
  <div class="mt-auto flex flex-col gap-1 border-t border-border-subtle pt-3">
    <Button
      as="a"
      href="https://www.comfy.org/contact"
      target="_blank"
      rel="noopener noreferrer"
      variant="muted-textonly"
      class="h-10 justify-start gap-3 px-3 font-normal no-underline"
    >
      <i class="icon-[lucide--circle-help] size-4" />{{
        t('prototype.settings.help')
      }}
    </Button>
    <Button
      as="a"
      href="https://docs.comfy.org"
      target="_blank"
      rel="noopener noreferrer"
      variant="muted-textonly"
      class="h-10 justify-start gap-3 px-3 font-normal no-underline"
    >
      <i class="icon-[lucide--book-open] size-4" />{{
        t('prototype.settings.docs')
      }}
    </Button>
    <Button
      v-if="fixture.mode === 'cloud'"
      variant="muted-textonly"
      class="h-10 justify-start gap-3 px-3 font-normal no-underline"
      @click="ui.openSettings('billing')"
    >
      <i class="icon-[lucide--coins] size-4 text-warning-background" />
      {{ t('prototype.settings.credits') }}
      <span class="ml-auto font-semibold tabular-nums">{{
        credits.toLocaleString()
      }}</span>
    </Button>
    <WorkspaceChip
      v-if="currentWorkspace && fixture.mode === 'cloud'"
      :workspace="currentWorkspace"
      :workspaces="fixture.workspaces"
      :current-user="fixture.currentUser"
      @select-workspace="cloud.switchWorkspace"
    />
    <WorkspaceCreateChip v-else />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import WorkspaceChip from './WorkspaceChip.vue'
import WorkspaceCreateChip from './WorkspaceCreateChip.vue'

const { t } = useI18n()
const personas = usePrototypePersonaStore()
const ui = usePrototypeUiStore()
const cloud = usePrototypeCustomCloudStore()
const { fixture, currentWorkspace } = storeToRefs(personas)
const credits = computed(() =>
  currentWorkspace.value?.tier === 'personal' &&
  fixture.value.workspaces.length > 1
    ? 0
    : (fixture.value.billing?.creditBalance.remaining ?? 0)
)
</script>
