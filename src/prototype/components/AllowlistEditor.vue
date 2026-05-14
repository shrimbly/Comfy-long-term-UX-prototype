<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             — workspace-level model + custom-node allowlists
             (delegable to Members via edit-allowlists grant).

  Reusable editor for a single allowlist (model, custom-node, partner-node).
  Enforce is a toggle switch in the header; when off, an inline hint
  appears below the header and the entries list dims to indicate the
  list is not currently gating anything. Admins can still curate
  entries while enforcement is off.
-->
<template>
  <SettingsPanel :title="title" :description="description">
    <template #actions>
      <label
        :class="
          cn(
            'inline-flex items-center gap-2 text-sm text-text-secondary',
            !canEdit && 'opacity-60'
          )
        "
      >
        <span>{{ t('prototype.views.settings.allowlist.enforceLabel') }}</span>
        <ToggleSwitch
          :model-value="enabled"
          :disabled="!canEdit"
          class="transition-transform active:scale-90"
          @update:model-value="
            (value: boolean) => emit('toggle-enabled', value)
          "
        />
      </label>
    </template>

    <SettingsSubCard v-if="!enabled">
      <p class="m-0 text-sm text-text-secondary">
        {{ t('prototype.views.settings.allowlist.offHint') }}
      </p>
    </SettingsSubCard>

    <SettingsSubCard
      v-if="entries.length"
      :class="cn('transition-opacity', !enabled && 'opacity-60')"
    >
      <ul class="m-0 flex list-none flex-col p-0">
        <li
          v-for="(entry, index) in entries"
          :key="entry.id"
          :class="
            cn(
              'flex items-center justify-between gap-3 py-2',
              index > 0 && 'border-t border-interface-stroke'
            )
          "
        >
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-sm text-text-primary">
              {{ entry.name }}
            </span>
            <span class="text-xs text-muted">
              {{
                t('prototype.views.settings.allowlist.addedBy', {
                  user: addedByLabel(entry.addedByUserId),
                  date: entry.addedAt
                })
              }}
            </span>
            <span v-if="entry.note" class="text-xs text-muted italic">
              {{ entry.note }}
            </span>
          </div>
          <Button
            v-if="canEdit"
            variant="muted-textonly"
            size="sm"
            @click="emit('remove', entry.id)"
          >
            {{ t('prototype.views.settings.allowlist.remove') }}
          </Button>
        </li>
      </ul>
    </SettingsSubCard>

    <p v-else class="m-0 text-sm text-text-secondary">
      {{ t('prototype.views.settings.allowlist.empty') }}
    </p>

    <form v-if="canEdit" class="flex gap-2" @submit.prevent="onSubmit">
      <input
        v-model="draft"
        type="text"
        :placeholder="addPlaceholder"
        class="h-10 flex-1 rounded-lg border border-interface-stroke bg-base-background px-3 text-sm text-text-primary outline-none focus:border-text-primary"
      />
      <Button
        as="button"
        type="submit"
        variant="inverted"
        size="lg"
        :disabled="!draft.trim()"
      >
        {{ t('prototype.views.settings.allowlist.add') }}
      </Button>
    </form>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import ToggleSwitch from 'primevue/toggleswitch'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from './settings/SettingsPanel.vue'
import SettingsSubCard from './settings/SettingsSubCard.vue'
import type { AllowlistEntry } from '../types'

const {
  title,
  description,
  entries,
  enabled,
  canEdit = false,
  addPlaceholder,
  addedByLabel
} = defineProps<{
  title: string
  description: string
  entries: AllowlistEntry[]
  enabled: boolean
  canEdit?: boolean
  addPlaceholder: string
  addedByLabel: (userId: string) => string
}>()

const emit = defineEmits<{
  add: [name: string]
  remove: [entryId: string]
  'toggle-enabled': [enabled: boolean]
}>()

const { t } = useI18n()

const draft = ref('')

function onSubmit() {
  const value = draft.value.trim()
  if (!value) return
  emit('add', value)
  draft.value = ''
}
</script>
