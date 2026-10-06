<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 3: the settings show where the project runs
    decision: ../IA_Plan/wiki/decisions/opinionated-roles-no-permission-matrix.md
              — only workspace admins change where a project runs

  The right-hand panel of the settings Projects page: where the project
  runs, who can open it, what it spent this month, and a way in.
-->
<template>
  <div class="flex flex-col gap-4">
    <dl class="m-0 flex flex-col divide-y divide-border-subtle">
      <ProjectSettingsRow
        :label="t('prototype.projectPage.settings.runsOn')"
        :detail="deployment.gpu"
      >
        <span class="flex items-center gap-3">
          <ProjectEnvironmentChip :deployment />
          <Button
            v-if="isAdmin"
            variant="link"
            size="sm"
            class="h-auto p-0"
            @click="isPickerOpen = true"
          >
            {{ t('prototype.projectPage.settings.change') }}
          </Button>
        </span>
      </ProjectSettingsRow>

      <ProjectSettingsRow :label="t('prototype.projectPage.settings.access')">
        <span>{{ accessText }}</span>
      </ProjectSettingsRow>

      <ProjectSettingsRow
        v-if="creditsThisMonth !== null"
        :label="t('prototype.projectPage.settings.usage')"
      >
        <span class="tabular-nums">
          {{
            t('prototype.projectPage.settings.thisMonth', {
              credits: creditsThisMonth.toLocaleString()
            })
          }}
        </span>
      </ProjectSettingsRow>
    </dl>

    <Button
      variant="secondary"
      size="md"
      class="self-start"
      @click="ui.go({ kind: 'project', projectId: project.id })"
    >
      {{ t('prototype.projectPage.settings.openProject') }}
    </Button>

    <ProjectEnvironmentPicker
      v-if="isPickerOpen"
      :project
      @close="isPickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useProjectAccess } from '../../composables/useProjectAccess'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import type { Project } from '../../types'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'
import ProjectEnvironmentPicker from './ProjectEnvironmentPicker.vue'
import ProjectSettingsRow from './ProjectSettingsRow.vue'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const ui = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))
const isPickerOpen = ref(false)
const isAdmin = computed(
  () => personaStore.currentWorkspace?.currentUserRole === 'admin'
)

const { accessLevel, peopleCount } = useProjectAccess(() => project)

const accessText = computed(() => {
  switch (accessLevel.value) {
    case 'everyone':
      return t('prototype.views.project.sharing.summaryAnyone', {
        workspace: personaStore.currentWorkspace?.name ?? ''
      })
    case 'private':
      return t('prototype.views.project.sharing.summaryPrivate')
    default:
      return t('prototype.views.project.sharing.summaryRestricted', {
        count: peopleCount.value
      })
  }
})

const creditsThisMonth = computed(
  () => project.monthlyUsage?.at(-1)?.credits ?? null
)
</script>
