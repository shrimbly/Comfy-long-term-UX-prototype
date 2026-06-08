<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md §"Install constraints
             (allowed-install set)" — identity-based shape.
    concept: ../IA_Plan/wiki/concepts/workspace-install-registry.md
             §"Sourcing for project allowed-install sets" — picker
             drawn from the workspace registry.
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md — hard
              lock semantics.
    log:     ../prototype/design-decisions.md 2026-05-19 — identity-
             based gate pivot.

  Project Settings section for the allowed-install set. Lists the
  project's current `allowedInstallIds` as workspace-canonical names,
  offers an add picker drawn from the workspace's blessed-install
  registry, lets the Owner edit `installLockDisplayName`. Visible only
  on team-workspace projects; editable iff `canEdit` is true.
-->
<template>
  <section v-if="isTeamWorkspace" class="flex flex-col gap-4">
    <header class="flex flex-col gap-1">
      <h2
        class="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.views.project.settings.installLock.heading') }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ t('prototype.views.project.settings.installLock.description') }}
      </p>
    </header>

    <div
      class="flex flex-col gap-4 rounded-lg border border-border-subtle bg-secondary-background p-4"
    >
      <div class="flex flex-col gap-2">
        <label
          for="install-lock-name"
          class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {{
            t('prototype.views.project.settings.installLock.canonicalNameLabel')
          }}
        </label>
        <input
          id="install-lock-name"
          type="text"
          :value="project.installLockDisplayName ?? ''"
          :placeholder="
            t(
              'prototype.views.project.settings.installLock.canonicalNamePlaceholder'
            )
          "
          :disabled="!canEdit"
          class="appearance-none rounded-md border border-border-default bg-base-background px-3 py-2 text-sm text-base-foreground placeholder:text-muted-foreground disabled:opacity-60"
          @change="onCanonicalNameChange"
        />
        <p class="text-xs text-muted-foreground">
          {{
            t('prototype.views.project.settings.installLock.canonicalNameHint')
          }}
        </p>
      </div>

      <div class="flex flex-col gap-2 border-t border-border-subtle pt-4">
        <span
          class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {{ t('prototype.views.project.settings.installLock.allowedHeading') }}
        </span>
        <ul
          v-if="allowedEntries.length > 0"
          class="m-0 flex list-none flex-col gap-1 p-0"
        >
          <li
            v-for="entry in allowedEntries"
            :key="entry.installId"
            class="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-base-background px-3 py-2 text-sm"
          >
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="flex items-center gap-2 truncate">
                <span class="truncate">{{ entry.label }}</span>
                <i
                  v-if="entry.isLocked"
                  :title="
                    t('prototype.views.project.settings.installLock.lockedHint')
                  "
                  class="icon-[lucide--lock] size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <span
                v-if="entry.description"
                class="truncate text-xs text-muted-foreground"
              >
                {{ entry.description }}
              </span>
            </span>
            <button
              v-if="canEdit"
              type="button"
              :aria-label="
                t(
                  'prototype.views.project.settings.installLock.removeInstallAria',
                  { name: entry.label }
                )
              "
              class="grid size-7 cursor-pointer appearance-none place-items-center rounded-sm border-0 bg-transparent text-muted-foreground hover:text-base-foreground"
              @click="onRemove(entry.installId)"
            >
              <i class="icon-[lucide--x] size-3.5" />
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">
          {{ t('prototype.views.project.settings.installLock.noneAllowed') }}
        </p>

        <div
          v-if="canEdit && registryOptions.length > 0"
          class="flex items-center gap-2 pt-2"
        >
          <select
            v-model="pickerSelection"
            class="flex-1 appearance-none rounded-md border border-border-default bg-base-background px-3 py-2 text-sm text-base-foreground"
          >
            <option value="" disabled>
              {{
                t(
                  'prototype.views.project.settings.installLock.pickerPlaceholder'
                )
              }}
            </option>
            <option
              v-for="opt in registryOptions"
              :key="opt.installId"
              :value="opt.installId"
            >
              {{ opt.canonicalDisplayName }}{{ opt.isLocked ? ' 🔒' : '' }}
            </option>
          </select>
          <Button
            variant="secondary"
            size="md"
            :disabled="!pickerSelection"
            @click="onAdd"
          >
            <i class="icon-[lucide--plus]" aria-hidden="true" />
            {{ t('prototype.views.project.settings.installLock.addAction') }}
          </Button>
        </div>
        <p
          v-else-if="canEdit && registryOptions.length === 0"
          class="text-xs text-muted-foreground"
        >
          {{ t('prototype.views.project.settings.installLock.registryEmpty') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { BlessedInstall, Project } from '../types'

const { project, canEdit } = defineProps<{
  project: Project
  canEdit: boolean
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)

const workspace = computed(() =>
  fixture.value.workspaces.find((w) => w.id === project.workspaceId)
)
const isTeamWorkspace = computed(() => workspace.value?.tier === 'team')

const registry = computed<BlessedInstall[]>(
  () => workspace.value?.blessedInstalls ?? []
)

interface AllowedEntry {
  installId: string
  label: string
  description?: string
  isLocked: boolean
}

const allowedEntries = computed<AllowedEntry[]>(() =>
  (project.allowedInstallIds ?? []).map((id) => {
    const entry = registry.value.find((b) => b.installId === id)
    return {
      installId: id,
      label: entry?.canonicalDisplayName ?? id,
      description: entry?.description,
      isLocked: entry?.isLocked ?? false
    }
  })
)

const registryOptions = computed(() =>
  registry.value.filter(
    (entry) => !(project.allowedInstallIds ?? []).includes(entry.installId)
  )
)

const pickerSelection = ref<string>('')

function onAdd() {
  if (!pickerSelection.value) return
  personaStore.addProjectAllowedInstall(project.id, pickerSelection.value)
  pickerSelection.value = ''
}

function onRemove(installId: string) {
  personaStore.removeProjectAllowedInstall(project.id, installId)
}

function onCanonicalNameChange(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  personaStore.setProjectInstallLockDisplayName(project.id, value)
}
</script>
