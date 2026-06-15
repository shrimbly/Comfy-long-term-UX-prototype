<!--
  Implements:
    open-q:   ../IA_Plan/wiki/open-questions.md#workflow-promotion-flow
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
    log:      ../prototype/design-decisions.md (2026-06-09 promotion;
              2026-06-16 publish = overwrite-existing OR new, stepped)

  Publish a workflow into a project, as a two-step wizard:
    Step 1 — Select a project (an existing one, or add a new one).
    Step 2 — Replace an existing workflow in that project, or add a new one.
             The new-workflow name defaults to the current file's name.
  For a copy, the source canonical + its project are pre-selected so the
  common "update the original" path is fast. Published workflows inherit
  the project's visibility. Built on the shared design-system Dialog.
-->
<template>
  <Dialog :open="true" @update:open="(v) => !v && emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader class="items-start pb-0">
          <DialogTitle>
            {{
              step === 1
                ? t('prototype.promoteToProject.step1Title')
                : t('prototype.promoteToProject.step2Title')
            }}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <!-- Step 1 — select project -->
        <div v-if="step === 1" class="flex flex-col px-2 py-1">
          <div
            v-if="candidates.length"
            class="flex max-h-64 flex-col gap-0.5 overflow-y-auto py-1 pr-0.5"
          >
            <Button
              v-for="p in candidates"
              :key="p.id"
              variant="textonly"
              size="unset"
              :class="rowClass(selectedId === p.id)"
              @click="selectProject(p.id)"
            >
              <span
                class="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-md"
                aria-hidden="true"
              >
                <span
                  v-for="(seed, i) in seedsFor(p)"
                  :key="i"
                  class="block rounded-[2px]"
                  :style="{ background: thumbnailGradient(seed) }"
                />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm text-base-foreground">{{
                  p.name
                }}</span>
                <span class="truncate text-xs text-muted-foreground">{{
                  t(`prototype.projectTier.${p.tier}`)
                }}</span>
              </span>
              <i
                v-if="selectedId === p.id"
                class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
              />
            </Button>
          </div>

          <div class="mx-2 my-1 h-px bg-border-subtle" />

          <div
            role="button"
            :tabindex="isNewProject ? -1 : 0"
            :class="
              cn(
                'flex items-center gap-3 rounded-lg p-2 transition-colors outline-none',
                isNewProject
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'cursor-pointer hover:bg-interface-menu-component-surface-hovered'
              )
            "
            @click="selectNewProject"
            @keydown.enter.prevent="selectNewProject"
          >
            <span
              :class="
                cn(
                  'grid h-8 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed transition-all duration-200 ease-out',
                  isNewProject
                    ? 'w-0 border-0 text-base-foreground opacity-0'
                    : 'w-8 border-border-default text-muted-foreground opacity-100'
                )
              "
              aria-hidden="true"
            >
              <i class="icon-[lucide--plus] size-4" />
            </span>
            <span
              :class="
                cn(
                  'overflow-hidden text-sm whitespace-nowrap text-base-foreground transition-all duration-200 ease-out',
                  isNewProject ? 'max-w-0 opacity-0' : 'flex-1 opacity-100'
                )
              "
            >
              {{ t('prototype.promoteToProject.newProjectOption') }}
            </span>
            <input
              ref="newProjectInput"
              v-model="newProjectName"
              type="text"
              :tabindex="isNewProject ? 0 : -1"
              :class="
                cn(
                  'min-w-0 rounded-md bg-base-background text-sm text-base-foreground transition-all duration-200 ease-out outline-none placeholder:text-muted-foreground',
                  isNewProject
                    ? 'flex-1 border border-border-default px-2.5 py-1.5 opacity-100'
                    : 'pointer-events-none w-0 border-0 p-0 opacity-0'
                )
              "
              :placeholder="
                t('prototype.promoteToProject.newProjectPlaceholder')
              "
              @keydown.enter="canContinue && goToStep2()"
            />
            <i
              :class="
                cn(
                  'icon-[lucide--check] size-4 shrink-0 text-base-foreground transition-opacity duration-200 ease-out',
                  isNewProject ? 'opacity-100' : 'opacity-0'
                )
              "
            />
          </div>
        </div>

        <!-- Step 2 — replace or add new -->
        <div v-else class="flex flex-col px-2 py-1">
          <p class="px-2 pt-1 pb-2 text-xs text-muted-foreground">
            {{
              t('prototype.promoteToProject.step2Subtitle', {
                project: targetProjectName
              })
            }}
          </p>

          <div
            class="flex max-h-48 flex-col gap-0.5 overflow-y-auto py-1 pr-0.5"
          >
            <Button
              v-for="w in targetCandidates"
              :key="w.id"
              variant="textonly"
              size="unset"
              :class="rowClass(targetWorkflowId === w.id)"
              @click="targetWorkflowId = w.id"
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-md bg-secondary-background text-muted-foreground"
                aria-hidden="true"
              >
                <i class="icon-[lucide--file] size-4" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col text-left">
                <span class="truncate text-sm text-base-foreground">{{
                  w.name
                }}</span>
                <span class="truncate text-xs text-muted-foreground">
                  {{ t('prototype.promoteToProject.overwriteHint') }}
                </span>
              </span>
              <i
                v-if="targetWorkflowId === w.id"
                class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
              />
            </Button>
          </div>

          <div
            v-if="targetCandidates.length"
            class="mx-2 my-1 h-px bg-border-subtle"
          />

          <div
            :class="
              cn(
                'flex items-center gap-3 rounded-lg p-2',
                isAddNew
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'cursor-pointer hover:bg-interface-menu-component-surface-hovered'
              )
            "
            role="button"
            tabindex="0"
            @click="targetWorkflowId = NEW_WORKFLOW"
            @keydown.enter.prevent="targetWorkflowId = NEW_WORKFLOW"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-md border border-dashed border-border-default text-muted-foreground"
              aria-hidden="true"
            >
              <i class="icon-[lucide--plus] size-4" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col text-left">
              <span class="text-sm text-base-foreground">
                {{ t('prototype.promoteToProject.newWorkflowOption') }}
              </span>
              <input
                v-if="isAddNew"
                ref="newWorkflowInput"
                v-model="newWorkflowName"
                type="text"
                class="mt-1 min-w-0 rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
                :placeholder="
                  t('prototype.promoteToProject.newWorkflowPlaceholder')
                "
                @click.stop
                @keydown.enter="canConfirm && onConfirm()"
              />
            </span>
            <i
              :class="
                cn(
                  'icon-[lucide--check] size-4 shrink-0 text-base-foreground',
                  isAddNew ? 'opacity-100' : 'opacity-0'
                )
              "
            />
          </div>
        </div>

        <DialogFooter>
          <template v-if="step === 1">
            <Button variant="textonly" @click="emit('close')">
              {{ t('prototype.promoteToProject.cancel') }}
            </Button>
            <Button
              variant="primary"
              :disabled="!canContinue"
              @click="goToStep2"
            >
              {{ t('prototype.promoteToProject.continue') }}
              <i class="icon-[lucide--arrow-right]" aria-hidden="true" />
            </Button>
          </template>
          <template v-else>
            <Button variant="textonly" @click="step = 1">
              <i class="icon-[lucide--arrow-left]" aria-hidden="true" />
              {{ t('prototype.promoteToProject.back') }}
            </Button>
            <Button
              variant="primary"
              :disabled="!canConfirm"
              @click="onConfirm"
            >
              <i class="icon-[lucide--upload]" aria-hidden="true" />
              {{ t('prototype.promoteToProject.confirm') }}
            </Button>
          </template>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { thumbnailGradient } from '../utils/thumbnail'
import type { Project } from '../types'

const { sourceWorkflowId } = defineProps<{
  // The workflow being published (a copy, or a My Workflows original).
  sourceWorkflowId: string
}>()

const emit = defineEmits<{
  close: []
  // targetWorkflowId === null → add as a NEW workflow (named newName);
  // otherwise overwrite that existing workflow.
  publish: [
    payload: {
      projectId: string
      isNewProject: boolean
      targetWorkflowId: string | null
      newName: string | null
    }
  ]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, visibleProjects } = storeToRefs(personaStore)

const NEW_PROJECT = '__new__'
const NEW_WORKFLOW = '__new_wf__'

const step = ref<1 | 2>(1)

const candidates = computed(() => visibleProjects.value)

const sourceName = computed(
  () =>
    fixture.value.workflows.find((w) => w.id === sourceWorkflowId)?.name ?? ''
)

// Four colour-tile seeds per project — the same identity glyph used on
// project cards, so projects read as projects rather than plain rows.
function seedsFor(project: Project): string[] {
  return [0, 1, 2, 3].map((i) => `${project.id}-${i}`)
}

function rowClass(selected: boolean): string {
  return cn(
    'w-full items-center gap-3 rounded-lg p-2 text-left',
    selected
      ? 'bg-interface-menu-component-surface-selected hover:bg-interface-menu-component-surface-selected'
      : 'hover:bg-interface-menu-component-surface-hovered'
  )
}

const selectedId = ref<string>('')
const newProjectName = ref<string>('')
const newProjectInput = ref<HTMLInputElement | null>(null)
const targetWorkflowId = ref<string>(NEW_WORKFLOW)
const newWorkflowName = ref<string>('')
const newWorkflowInput = ref<HTMLInputElement | null>(null)

const isNewProject = computed(() => selectedId.value === NEW_PROJECT)
const isAddNew = computed(() => targetWorkflowId.value === NEW_WORKFLOW)

const targetProjectName = computed(() =>
  isNewProject.value
    ? newProjectName.value.trim()
    : (candidates.value.find((p) => p.id === selectedId.value)?.name ?? '')
)

// Existing canonical workflows in the selected project that could be
// overwritten (a copy carries `forkedFrom`; canonicals don't).
const targetCandidates = computed(() => {
  if (!selectedId.value || isNewProject.value) return []
  return fixture.value.workflows.filter(
    (w) => w.projectId === selectedId.value && !w.forkedFrom
  )
})

function selectProject(id: string) {
  selectedId.value = id
}

async function selectNewProject() {
  selectedId.value = NEW_PROJECT
  await nextTick()
  newProjectInput.value?.focus()
}

const canContinue = computed(() =>
  isNewProject.value ? !!newProjectName.value.trim() : !!selectedId.value
)

async function goToStep2() {
  if (!canContinue.value) return
  // A copy's source canonical (if it's in the chosen project) is the
  // default overwrite target; otherwise default to adding a new workflow.
  const source = fixture.value.workflows.find((w) => w.id === sourceWorkflowId)
  const canonicalId = source?.forkedFrom?.workflowId
  targetWorkflowId.value =
    canonicalId && targetCandidates.value.some((w) => w.id === canonicalId)
      ? canonicalId
      : NEW_WORKFLOW
  step.value = 2
  if (isAddNew.value) {
    await nextTick()
    newWorkflowInput.value?.focus()
  }
}

const canConfirm = computed(() =>
  isAddNew.value ? !!newWorkflowName.value.trim() : !!targetWorkflowId.value
)

onMounted(() => {
  newWorkflowName.value = sourceName.value
  // Pre-select the source copy's project so step 1 opens on the likely
  // destination. Only when that project is a visible candidate.
  const source = fixture.value.workflows.find((w) => w.id === sourceWorkflowId)
  const canonicalId = source?.forkedFrom?.workflowId
  if (!canonicalId) return
  const canonical = fixture.value.workflows.find((w) => w.id === canonicalId)
  if (canonical && candidates.value.some((p) => p.id === canonical.projectId)) {
    selectedId.value = canonical.projectId
  }
})

function onConfirm() {
  if (!canConfirm.value) return
  const isNew = selectedId.value === NEW_PROJECT
  const projectId = isNew
    ? personaStore.createProject(newProjectName.value)
    : selectedId.value
  const addingNew = isAddNew.value
  emit('publish', {
    projectId,
    isNewProject: isNew,
    targetWorkflowId: addingNew ? null : targetWorkflowId.value,
    newName: addingNew ? newWorkflowName.value.trim() : null
  })
}
</script>
