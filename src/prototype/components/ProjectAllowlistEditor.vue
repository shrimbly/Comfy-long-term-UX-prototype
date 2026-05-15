<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
             §"What it contains" — model + custom-node allowlists are
             Owner-editable project settings.
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Project level" — Owner-only to edit project allowlists.
    log:     ../prototype/design-decisions.md (2026-05-15) — strict
             override combine rule; opt-in per allowlist.

  Per-project allowlist card. Mirrors the workspace AllowlistEditor's
  shell (SettingsPanel + SettingsSubCard + entries list + add form) but
  the toggle semantics differ:

    enforce (workspace) — when off, the list does not gate anything.
    override (project)  — when off, the list does nothing; the project
                          inherits the workspace allowlist verbatim.
                          When on, the project's list replaces the
                          workspace list entirely (strict override —
                          workspace entries are NOT unioned in).

  Off state shows the inherited workspace entries read-only so an Owner
  can see what they are about to replace before flipping the switch.
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
        <span>
          {{ t('prototype.views.project.settings.allowlist.overrideLabel') }}
        </span>
        <ToggleSwitch
          :model-value="override"
          :disabled="!canEdit"
          class="transition-transform active:scale-90"
          @update:model-value="
            (value: boolean) => emit('toggle-override', value)
          "
        />
      </label>
    </template>

    <SettingsSubCard v-if="!override">
      <p class="m-0 text-sm text-text-secondary">
        {{ t('prototype.views.project.settings.allowlist.inheritHint') }}
      </p>
      <ul
        v-if="workspaceEntries.length"
        class="m-0 mt-2 flex list-none flex-col p-0"
      >
        <li
          v-for="(entry, index) in workspaceEntries"
          :key="entry.id"
          :class="
            cn(
              'flex items-center justify-between gap-3 py-2 opacity-80',
              index > 0 && 'border-t border-interface-stroke'
            )
          "
        >
          <span class="truncate text-sm text-text-primary">
            {{ entry.name }}
          </span>
          <span class="text-xs text-muted">
            {{ t('prototype.views.project.settings.allowlist.fromWorkspace') }}
          </span>
        </li>
      </ul>
      <p v-else class="m-0 mt-2 text-xs text-muted italic">
        {{ t('prototype.views.project.settings.allowlist.workspaceEmpty') }}
      </p>
    </SettingsSubCard>

    <template v-else>
      <SettingsSubCard
        v-if="entries.length"
        class="bg-warning-background/5 ring-1 ring-warning-background/20"
      >
        <p class="m-0 mb-2 text-xs text-text-secondary">
          {{ t('prototype.views.project.settings.allowlist.overrideHint') }}
        </p>
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

      <SettingsSubCard
        v-else
        class="bg-destructive-background/5 ring-1 ring-destructive-background/20"
      >
        <p class="m-0 text-sm text-text-primary">
          {{ t('prototype.views.project.settings.allowlist.emptyOverride') }}
        </p>
      </SettingsSubCard>

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
    </template>
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
  override,
  entries,
  workspaceEntries,
  canEdit = false,
  addPlaceholder,
  addedByLabel
} = defineProps<{
  title: string
  description: string
  override: boolean
  entries: AllowlistEntry[]
  workspaceEntries: AllowlistEntry[]
  canEdit?: boolean
  addPlaceholder: string
  addedByLabel: (userId: string) => string
}>()

const emit = defineEmits<{
  add: [name: string]
  remove: [entryId: string]
  'toggle-override': [override: boolean]
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
