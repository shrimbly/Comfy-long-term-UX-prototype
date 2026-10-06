<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 3: the settings show where the project runs
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
    decision: ../IA_Plan/wiki/decisions/opinionated-roles-no-permission-matrix.md
              — only workspace admins change where a project runs

  The few settings a project has: where it runs, who can open it, what it
  spent this month. Used on the project page (tab, sheet or rail) with a
  link to the full settings page, and on that page's right-hand panel.
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
            v-if="isAdmin && footer === 'open-project'"
            variant="link"
            size="sm"
            class="h-auto p-0"
            @click="onChange"
          >
            {{ t('prototype.projectPage.settings.change') }}
          </Button>
        </span>
      </ProjectSettingsRow>

      <ProjectSettingsRow :label="t('prototype.projectPage.settings.access')">
        <span>{{ accessText }}</span>
      </ProjectSettingsRow>

      <ProjectSettingsRow
        v-if="usage && creditsThisMonth !== null"
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
      v-if="footer === 'all-settings'"
      variant="link"
      size="sm"
      class="h-auto self-start p-0"
      @click="ui.openProjectSettings(project.id)"
    >
      {{ t('prototype.projectPage.settings.allSettings') }}
      <i class="icon-[lucide--arrow-right] size-3.5" />
    </Button>
    <Button
      v-else
      variant="secondary"
      size="md"
      class="self-start"
      @click="openProject"
    >
      {{ t('prototype.projectPage.settings.openProject') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { useProjectAccess } from '../../composables/useProjectAccess'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import type { Project } from '../../types'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'
import ProjectSettingsRow from './ProjectSettingsRow.vue'

const {
  project,
  footer,
  usage = false
} = defineProps<{
  project: Project
  footer: 'all-settings' | 'open-project'
  usage?: boolean
}>()

const { t } = useI18n()
const toast = useToastStore()
const ui = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))
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

function openProject() {
  ui.go({ kind: 'project', projectId: project.id })
}

function onChange() {
  toast.add({
    severity: 'info',
    summary: t('prototype.projectPage.settings.change'),
    detail: t('prototype.customCloud.settings.changeToastDetail'),
    life: 3000
  })
}
</script>
