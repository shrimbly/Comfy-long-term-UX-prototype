<!--
  Implements:
    open-q:   ../IA_Plan/wiki/open-questions.md#workflow-promotion-flow
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
    log:      ../prototype/design-decisions.md (2026-06-09 promotion;
              2026-06-16 publish = overwrite-existing OR new, stepped)

  Publish a workflow into a project, as a two-step wizard:
    Step 1 — Select a project. A "New project" action in the footer
             reveals an inline name field at the top of the list.
    Step 2 — Name the workflow ("Save as:", defaulting to the current
             file's name), or select an existing workflow to replace.
  For a copy, the source's project is pre-selected so the common
  destination is one step away. Published workflows inherit the
  project's visibility. Built on the shared design-system Dialog.
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
            v-if="isNewProject"
            class="flex items-center gap-3 rounded-lg bg-interface-menu-component-surface-selected p-2"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-md bg-secondary-background text-muted-foreground"
              aria-hidden="true"
            >
              <i class="icon-[lucide--folder-plus] size-4" />
            </span>
            <input
              ref="newProjectInput"
              v-model="newProjectName"
              type="text"
              class="min-w-0 flex-1 rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
              :placeholder="
                t('prototype.promoteToProject.newProjectPlaceholder')
              "
              @keydown.enter="canContinue && goToStep2()"
            />
          </div>

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
        </div>

        <!-- Step 2 — name the workflow, or replace an existing one -->
        <div v-else class="flex flex-col gap-2 px-2 py-1">
          <label class="flex items-center gap-2 px-2 pt-1">
            <span class="shrink-0 text-sm text-muted-foreground">
              {{ t('prototype.promoteToProject.saveAs') }}
            </span>
            <input
              ref="newWorkflowInput"
              v-model="newWorkflowName"
              type="text"
              :disabled="isReplacing"
              class="min-w-0 flex-1 rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              :placeholder="
                t('prototype.promoteToProject.newWorkflowPlaceholder')
              "
              @keydown.enter="canConfirm && onConfirm()"
            />
          </label>

          <p class="px-2 text-xs text-muted-foreground">
            {{
              t('prototype.promoteToProject.step2Subtitle', {
                project: targetProjectName
              })
            }}
          </p>

          <div
            v-if="targetCandidates.length"
            class="flex min-h-0 flex-col gap-0.5"
          >
            <p
              class="px-2 pt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ t('prototype.promoteToProject.replaceHeading') }}
            </p>
            <div
              class="flex max-h-44 flex-col gap-0.5 overflow-y-auto py-1 pr-0.5"
            >
              <Button
                v-for="w in targetCandidates"
                :key="w.id"
                variant="textonly"
                size="unset"
                :class="rowClass(targetWorkflowId === w.id)"
                @click="toggleTarget(w.id)"
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
          </div>
        </div>

        <DialogFooter>
          <template v-if="step === 1">
            <Button
              variant="textonly"
              :class="
                cn(
                  'mr-auto',
                  isNewProject && 'bg-interface-menu-component-surface-selected'
                )
              "
              @click="toggleNewProject"
            >
              <i class="icon-[lucide--plus]" aria-hidden="true" />
              {{ t('prototype.promoteToProject.newProjectOption') }}
            </Button>
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
// '' → save as a new workflow; an id → overwrite that existing workflow.
const targetWorkflowId = ref<string>('')
const newWorkflowName = ref<string>('')
const newWorkflowInput = ref<HTMLInputElement | null>(null)

const isNewProject = computed(() => selectedId.value === NEW_PROJECT)
const isReplacing = computed(() => !!targetWorkflowId.value)

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

async function toggleNewProject() {
  if (isNewProject.value) {
    selectedId.value = ''
    return
  }
  selectedId.value = NEW_PROJECT
  await nextTick()
  newProjectInput.value?.focus()
}

function toggleTarget(id: string) {
  targetWorkflowId.value = targetWorkflowId.value === id ? '' : id
}

const canContinue = computed(() =>
  isNewProject.value ? !!newProjectName.value.trim() : !!selectedId.value
)

const canConfirm = computed(() =>
  isReplacing.value ? true : !!newWorkflowName.value.trim()
)

async function goToStep2() {
  if (!canContinue.value) return
  targetWorkflowId.value = ''
  step.value = 2
  await nextTick()
  newWorkflowInput.value?.focus()
  newWorkflowInput.value?.select()
}

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
  emit('publish', {
    projectId,
    isNewProject: isNew,
    targetWorkflowId: isReplacing.value ? targetWorkflowId.value : null,
    newName: isReplacing.value ? null : newWorkflowName.value.trim()
  })
}
</script>
