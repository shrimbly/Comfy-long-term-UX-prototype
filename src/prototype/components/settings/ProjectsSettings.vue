<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — every project
             and where it runs, in one place
    log:     ../prototype/design-decisions.md (2026-10-07 — settings Projects
             page, panel on the right like Claude Console workspaces)

  Workspace settings → Projects. A list of the projects the viewer can
  open. Picking one opens its settings in a panel on the right.
-->
<template>
  <div class="flex items-start gap-8">
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <label
        class="flex h-9 max-w-xs items-center gap-2 rounded-lg bg-secondary-background px-2.5"
      >
        <i
          class="icon-[lucide--search] size-4 shrink-0 text-muted-foreground"
        />
        <input
          v-model="query"
          type="text"
          :placeholder="t('prototype.views.projects.searchPlaceholder')"
          class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <table v-if="rows.length" class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left text-xs text-muted-foreground">
            <th class="pb-2 pl-3 font-normal">
              {{ t('prototype.settings.projects.name') }}
            </th>
            <th class="pb-2 font-normal">
              {{ t('prototype.projectPage.settings.runsOn') }}
            </th>
            <th class="pb-2 font-normal">
              {{ t('prototype.settings.projects.people') }}
            </th>
            <th class="pr-3 pb-2 text-right font-normal">
              {{ t('prototype.settings.projects.workflows') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.project.id"
            :class="
              cn(
                'cursor-pointer border-t border-border-subtle transition-colors',
                row.project.id === ui.settingsProjectId
                  ? 'bg-secondary-background'
                  : 'hover:bg-secondary-background/50'
              )
            "
            :aria-selected="row.project.id === ui.settingsProjectId"
            @click="ui.settingsProjectId = row.project.id"
          >
            <td class="py-2.5 pl-3">
              <span class="flex items-center gap-2.5">
                <ProjectTile
                  :project="row.project"
                  :deployment="row.deployment"
                  size="sm"
                />
                <span class="truncate">{{ row.project.name }}</span>
              </span>
            </td>
            <td class="py-2.5">
              <ProjectEnvironmentChip :deployment="row.deployment" />
            </td>
            <td class="py-2.5 tabular-nums">{{ row.people }}</td>
            <td class="py-2.5 pr-3 text-right tabular-nums">
              {{ row.workflows }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="m-0 text-sm text-muted-foreground">
        {{ t('prototype.views.projects.searchEmpty') }}
      </p>
    </div>

    <aside
      v-if="selected"
      :key="selected.id"
      class="sticky top-0 flex w-80 shrink-0 flex-col gap-5 rounded-xl border border-border-subtle p-5"
    >
      <header class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-xs text-muted-foreground">
            {{ t('prototype.settings.projects.eyebrow') }}
          </span>
          <span class="flex items-center gap-2">
            <ProjectTile
              :project="selected"
              :deployment="customCloud.deploymentOf(selected.id)"
              size="sm"
            />
            <span class="truncate text-base font-medium">
              {{ selected.name }}
            </span>
          </span>
        </div>
        <Button
          variant="muted-textonly"
          size="icon-sm"
          :aria-label="t('prototype.settings.projects.close')"
          @click="ui.settingsProjectId = null"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>
      </header>
      <ProjectSettingsPanel :project="selected" footer="open-project" usage />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import { projectAccessLevel } from '../../utils/projectAccess'
import ProjectTile from '../ProjectTile.vue'
import ProjectEnvironmentChip from '../project/ProjectEnvironmentChip.vue'
import ProjectSettingsPanel from '../project/ProjectSettingsPanel.vue'

const { t } = useI18n()
const ui = usePrototypeUiStore()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const { fixture, visibleProjects } = storeToRefs(personaStore)

const query = ref('')

const rows = computed(() =>
  visibleProjects.value
    .filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase()))
    .map((project) => ({
      project,
      deployment: customCloud.deploymentOf(project.id),
      people: peopleText(project),
      workflows: fixture.value.workflows.filter(
        (w) => w.projectId === project.id && !w.forkedFrom
      ).length
    }))
)

const selected = computed(() =>
  visibleProjects.value.find((p) => p.id === ui.settingsProjectId)
)

function peopleText(project: (typeof visibleProjects.value)[number]) {
  if (projectAccessLevel(project) === 'everyone') {
    return t('prototype.projectPage.meta.everyone')
  }
  const ids = new Set([
    project.ownerUserId,
    ...(project.members ?? []).map((m) => m.userId)
  ])
  return String(ids.size)
}
</script>
