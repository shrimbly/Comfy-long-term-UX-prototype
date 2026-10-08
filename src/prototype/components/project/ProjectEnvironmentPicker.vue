<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — a project points at one deployment; many projects can share it
    decision: ../IA_Plan/wiki/decisions/opinionated-roles-no-permission-matrix.md
    log:      ../prototype/design-decisions.md (2026-10-07 — change
              environment: pick an existing one or create a new one)

  Change where a project runs: Comfy Cloud or one of the workspace's custom
  environments, or create a new one on the spot.
-->
<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent class="shadow-none" size="md">
        <DialogHeader>
          <DialogTitle>
            {{ t('prototype.projectPage.environmentPicker.title') }}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div class="flex flex-col gap-4 px-6 py-4">
          <DialogDescription>
            {{ t('prototype.projectPage.environmentPicker.hint') }}
          </DialogDescription>
          <div role="radiogroup" class="flex flex-col gap-1.5">
            <button
              v-for="option in options"
              :key="option.id"
              type="button"
              role="radio"
              :aria-checked="selectedId === option.id"
              :class="
                cn(
                  'flex w-full cursor-pointer appearance-none items-center gap-3 rounded-xl border px-4 py-3 text-left text-base-foreground transition-colors active:scale-[0.99]',
                  selectedId === option.id
                    ? 'border-base-foreground bg-secondary-background'
                    : 'border-border-subtle bg-transparent hover:bg-secondary-background/50'
                )
              "
              @click="selectedId = option.id"
            >
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <ProjectEnvironmentChip :deployment="option" class="text-sm" />
                <span class="text-xs text-muted-foreground">
                  {{ optionDetail(option) }}
                </span>
              </span>
              <i
                v-if="selectedId === option.id"
                class="icon-[lucide--check] size-4 shrink-0"
              />
            </button>
          </div>
          <Button
            v-if="environments.canManage"
            variant="muted-textonly"
            size="md"
            class="self-start"
            @click="openCreate"
          >
            <i class="icon-[lucide--plus] size-4" />
            {{ t('prototype.environments.new') }}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="muted-textonly" @click="emit('close')">
            {{ t('g.close') }}
          </Button>
          <Button
            variant="secondary"
            :disabled="selectedId === currentId"
            @click="apply"
          >
            {{ t('prototype.projectPage.environmentPicker.switch') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>

  <DeploymentDialog v-if="isCreating" @close="onCreated" />
</template>

<script setup lang="ts">
import { useHomesteadStore } from '../../homestead/store'
const homestead = useHomesteadStore()
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

import { COMFY_CLOUD } from '../../fixtures/customCloud'
import { usePrototypeEnvironmentStore } from '../../stores/environmentStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import type { Deployment, Project } from '../../types'
import DeploymentDialog from '../DeploymentDialog.vue'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'

const { project } = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const environments = usePrototypeEnvironmentStore()

const currentId = project.deploymentId ?? COMFY_CLOUD.id
const selectedId = ref(currentId)
const isCreating = ref(false)
let countBeforeCreate = 0

const options = computed<Deployment[]>(() => [
  COMFY_CLOUD,
  ...environments.deployments
])

function projectsOn(deployment: Deployment) {
  return personaStore.visibleProjects.filter((p) =>
    deployment.kind === 'custom'
      ? p.deploymentId === deployment.id
      : !p.deploymentId
  ).length
}

function optionDetail(deployment: Deployment) {
  const gpu =
    deployment.gpu ?? t('prototype.projectPage.environmentSheet.gpuShared')
  return `${gpu} · ${t('prototype.environments.projects', projectsOn(deployment))}`
}

// The create dialog appends to the store, so a longer list means a new
// environment to select.
function openCreate() {
  countBeforeCreate = environments.deployments.length
  isCreating.value = true
}

function onCreated() {
  isCreating.value = false
  const newest = environments.deployments.at(-1)
  if (newest && environments.deployments.length > countBeforeCreate) {
    selectedId.value = newest.id
  }
}

function apply() {
  if (homestead.enabled) {
    homestead.projectId = project.id
    homestead.projectEnvironmentId =
      homestead.projectEnvironments[project.id] ?? COMFY_CLOUD.id
    homestead.dialog = 'environment'
    homestead.switchEnvironment(selectedId.value)
    emit('close')
    return
  }
  personaStore.setProjectDeployment(
    project.id,
    selectedId.value === COMFY_CLOUD.id ? undefined : selectedId.value
  )
  emit('close')
}
</script>
