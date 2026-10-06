<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — the settings
              show where the project runs
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — project
              level: owner and workspace admins manage the project
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
    decision: ../IA_Plan/wiki/decisions/opinionated-roles-no-permission-matrix.md
    log:      ../prototype/design-decisions.md (2026-10-07 — project
              settings sections for a studio)

  The Settings tab of a project: General, Environment, Access, Credits and
  Delete as a column of cards. The environment opens a sheet; Change opens
  the picker.
  Owners and workspace admins edit; everyone else reads.
-->
<template>
  <div class="flex flex-col gap-4">
    <section :class="sectionClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.projectPage.settings.general') }}
        </h2>
      </div>
      <dl :class="rowsClass">
        <ProjectSettingsRow :label="t('prototype.projectPage.settings.name')">
          <input
            v-if="canManage"
            :value="project.name"
            type="text"
            :class="inputClass"
            :aria-label="t('prototype.projectPage.settings.name')"
            @change="
              personaStore.renameProject(
                project.id,
                ($event.target as HTMLInputElement).value
              )
            "
          />
          <span v-else>{{ project.name }}</span>
        </ProjectSettingsRow>
        <ProjectSettingsRow
          :label="t('prototype.projectPage.settings.thumbnail')"
        >
          <span
            class="grid aspect-3/2 w-28 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-md outline-1 -outline-offset-1 outline-white/10"
            aria-hidden="true"
          >
            <span
              v-for="(tile, i) in thumbnailTiles"
              :key="i"
              :class="cn('block', !tile && 'bg-base-background/40')"
              :style="
                tile ? { background: workflowThumbnail(tile) } : undefined
              "
            />
          </span>
        </ProjectSettingsRow>
      </dl>
    </section>

    <section :class="sectionClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.projectPage.settings.environment') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.projectPage.settings.environmentHint') }}
        </p>
      </div>
      <dl :class="rowsClass">
        <ProjectSettingsRow
          :label="t('prototype.projectPage.settings.runsOn')"
          :detail="deployment.gpu"
        >
          <span class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-md text-base-foreground transition-colors hover:text-muted-foreground active:scale-[0.96]"
              :aria-label="t('prototype.projectPage.environmentSheet.open')"
              @click="isEnvironmentOpen = true"
            >
              <ProjectEnvironmentChip :deployment />
              <i class="icon-[lucide--chevron-right] size-3.5" />
            </button>
            <Button
              v-if="canManage"
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click="isPickerOpen = true"
            >
              {{ t('prototype.projectPage.settings.change') }}
            </Button>
          </span>
        </ProjectSettingsRow>
      </dl>
    </section>

    <section :class="sectionClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.projectPage.settings.access') }}
        </h2>
      </div>
      <dl :class="rowsClass">
        <ProjectSettingsRow
          :label="t('prototype.projectPage.settings.generalAccess')"
        >
          <TierDropdown
            v-if="canManage"
            :tier="project.tier"
            @select="personaStore.setProjectTier(project.id, $event)"
          />
          <span v-else>{{ accessText }}</span>
        </ProjectSettingsRow>
        <ProjectSettingsRow :label="t('prototype.projectPage.settings.people')">
          <span class="flex items-center gap-3">
            <span>{{
              t('prototype.views.project.sharing.summaryRestricted', {
                count: peopleCount
              })
            }}</span>
            <Button
              variant="link"
              size="sm"
              class="h-auto p-0"
              @click="emit('members')"
            >
              {{ t('prototype.projectPage.settings.manage') }}
            </Button>
          </span>
        </ProjectSettingsRow>
      </dl>
    </section>

    <section :class="sectionClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.projectPage.settings.credits') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.projectPage.settings.creditsHint') }}
        </p>
      </div>
      <dl :class="rowsClass">
        <ProjectSettingsRow
          :label="t('prototype.projectPage.settings.budget')"
          :detail="t('prototype.projectPage.settings.budgetHint')"
        >
          <input
            v-if="canManage"
            :value="project.monthlyCreditBudget ?? ''"
            type="number"
            min="0"
            step="100"
            :placeholder="t('prototype.projectPage.settings.notSet')"
            :class="cn(inputClass, 'w-40 text-right tabular-nums')"
            :aria-label="t('prototype.projectPage.settings.budget')"
            @change="
              setCredits({
                monthlyCreditBudget: numberOrUndefined($event)
              })
            "
          />
          <span v-else class="tabular-nums">{{
            formatCredits(project.monthlyCreditBudget)
          }}</span>
        </ProjectSettingsRow>
        <ProjectSettingsRow
          :label="t('prototype.projectPage.settings.memberLimit')"
          :detail="t('prototype.projectPage.settings.memberLimitHint')"
        >
          <input
            v-if="canManage"
            :value="project.defaultMemberCreditLimit ?? ''"
            type="number"
            min="0"
            step="100"
            :placeholder="t('prototype.projectPage.settings.notSet')"
            :class="cn(inputClass, 'w-40 text-right tabular-nums')"
            :aria-label="t('prototype.projectPage.settings.memberLimit')"
            @change="
              setCredits({
                defaultMemberCreditLimit: numberOrUndefined($event)
              })
            "
          />
          <span v-else class="tabular-nums">{{
            formatCredits(project.defaultMemberCreditLimit)
          }}</span>
        </ProjectSettingsRow>
      </dl>
    </section>

    <section v-if="canManage" :class="sectionClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.projectPage.settings.danger') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.projectPage.settings.dangerHint') }}
        </p>
      </div>
      <div>
        <Button variant="destructive" size="md" @click="onDelete">
          {{ t('prototype.projectPage.settings.delete') }}
        </Button>
      </div>
    </section>

    <ProjectEnvironmentSheet
      v-if="isEnvironmentOpen"
      :deployment
      @close="isEnvironmentOpen = false"
    />
    <ProjectEnvironmentPicker
      v-if="isPickerOpen"
      :project
      @close="isPickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useProjectAccess } from '../../composables/useProjectAccess'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import type { Project, ProjectCreditSettings } from '../../types'
import { workflowThumbnail } from '../../utils/thumbnail'
import TierDropdown from '../TierDropdown.vue'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'
import ProjectEnvironmentPicker from './ProjectEnvironmentPicker.vue'
import ProjectEnvironmentSheet from './ProjectEnvironmentSheet.vue'
import ProjectSettingsRow from './ProjectSettingsRow.vue'

const { project } = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  members: []
}>()

const sectionClass =
  'flex flex-col gap-4 rounded-2xl border border-border-subtle bg-secondary-background/40 p-6'
const headingClass = 'm-0 text-sm font-medium'
const hintClass = 'mt-1 mb-0 text-sm text-muted-foreground'
const rowsClass = 'm-0 flex flex-col'
const inputClass =
  'h-9 w-72 rounded-lg border border-border-subtle bg-base-background px-3 text-sm text-base-foreground outline-none focus:border-base-foreground'

const { t } = useI18n()
const ui = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))
const isEnvironmentOpen = ref(false)
const isPickerOpen = ref(false)

const canManage = computed(
  () =>
    personaStore.currentWorkspace?.currentUserRole === 'admin' ||
    project.ownerUserId === personaStore.fixture.currentUser.id
)

const { accessLevel, peopleCount } = useProjectAccess(() => project)

// The same four-tile preview as the project card: one tile per published
// workflow, empty slots recessed.
const thumbnailTiles = computed(() => {
  const items = personaStore.fixture.workflows
    .filter((w) => w.projectId === project.id && !w.forkedFrom)
    .slice(0, 4)
  return Array.from({ length: 4 }, (_, i) => items[i] ?? null)
})

const accessText = computed(() =>
  accessLevel.value === 'everyone'
    ? t('prototype.views.project.sharing.summaryAnyone', {
        workspace: personaStore.currentWorkspace?.name ?? ''
      })
    : t('prototype.views.project.sharing.tier.restricted.label')
)

function formatCredits(value: number | undefined) {
  return value === undefined
    ? t('prototype.projectPage.settings.notSet')
    : value.toLocaleString()
}

function numberOrUndefined(event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function setCredits(patch: ProjectCreditSettings) {
  personaStore.updateProjectCredits(project.id, patch)
}

function onDelete() {
  const confirmed = window.confirm(
    t('prototype.projectPage.settings.deleteConfirm', { name: project.name })
  )
  if (!confirmed) return
  personaStore.deleteProject(project.id)
  ui.go({ kind: 'projects' })
}
</script>
