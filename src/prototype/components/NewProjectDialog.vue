<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    log:      ../prototype/design-decisions.md (2026-06-20 New-project dialog)

  Create-a-project dialog opened from the Projects page. Name + the General
  access section from the sharing surface: a fresh project defaults to
  Workspace-wide ("Anyone in {workspace}"). Switching the tier dropdown to
  Restricted reveals an add-people picker so collaborators can be seeded at
  creation. Commits via personaStore.createProject on Create.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <div
        class="my-auto flex max-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col gap-3 rounded-2xl border border-border-subtle bg-base-background p-5 shadow-2xl"
      >
        <header class="flex shrink-0 flex-col gap-0.5">
          <h2 class="text-lg/tight font-semibold">
            {{ t('prototype.views.projects.newProjectDialog.title') }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ t('prototype.views.projects.newProjectDialog.subtitle') }}
          </p>
        </header>

        <label class="flex shrink-0 flex-col gap-1.5">
          <span
            class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.projects.newProjectDialog.nameLabel') }}
          </span>
          <input
            ref="nameInput"
            v-model="name"
            type="text"
            :placeholder="
              t('prototype.views.projects.newProjectDialog.namePlaceholder')
            "
            class="h-10 rounded-lg border border-border-subtle bg-secondary-background px-3 text-sm outline-none focus:border-base-foreground"
            @keydown.enter="submit"
          />
        </label>

        <section class="flex shrink-0 flex-col gap-2">
          <h3
            class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.project.sharing.generalAccessHeading') }}
          </h3>
          <div
            class="flex items-center gap-3 rounded-xl border border-border-subtle bg-base-background px-3 py-2.5"
          >
            <span
              :class="
                cn(
                  'grid size-9 shrink-0 place-items-center rounded-full bg-secondary-background',
                  tierIcon
                )
              "
            />
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="text-sm font-medium">{{ tierLabel }}</span>
              <span class="text-xs text-muted-foreground">{{
                tierDescription
              }}</span>
            </div>
            <TierDropdown :tier="tier" @select="tier = $event" />
          </div>
        </section>

        <section
          v-if="tier === 'restricted'"
          class="flex min-h-0 flex-1 flex-col gap-2"
        >
          <h3
            class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.projects.newProjectDialog.peopleHeading') }}
          </h3>
          <div ref="pickerRef" class="relative shrink-0">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('prototype.views.project.sharing.addPlaceholder')"
              class="h-10 w-full rounded-lg border border-border-subtle bg-secondary-background px-3 text-sm outline-none focus:border-base-foreground"
              @focus="pickerOpen = true"
              @keydown.enter="onEnterSubmit"
            />
            <div
              v-if="pickerOpen && pickerCandidates.length"
              class="absolute inset-x-0 top-full z-20 mt-1 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border-default bg-interface-menu-surface p-1 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
            >
              <button
                v-for="candidate in pickerCandidates"
                :key="candidate.id"
                type="button"
                class="flex w-full cursor-pointer appearance-none items-center gap-3 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
                @click="addCollaborator(candidate.id)"
              >
                <span
                  class="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
                  :style="{ backgroundColor: candidate.avatarColor }"
                >
                  {{ candidate.initial }}
                </span>
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-sm">{{ candidate.name }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{
                    candidate.email
                  }}</span>
                </span>
              </button>
            </div>
          </div>

          <ul
            v-if="collaboratorRows.length"
            class="m-0 min-h-0 flex-1 list-none overflow-y-auto rounded-xl border border-border-subtle bg-base-background p-0"
          >
            <li
              v-for="(row, i) in collaboratorRows"
              :key="row.id"
              :class="
                cn(
                  'flex items-center gap-3 px-3 py-2',
                  i > 0 && 'border-t border-border-subtle'
                )
              "
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
                :style="{ backgroundColor: row.avatarColor }"
              >
                {{ row.initial }}
              </span>
              <div class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm font-medium">{{ row.name }}</span>
                <span class="truncate text-xs text-muted-foreground">{{
                  row.email
                }}</span>
              </div>
              <Button
                variant="muted-textonly"
                size="icon-sm"
                :aria-label="
                  t('prototype.views.projects.newProjectDialog.removePerson', {
                    name: row.name
                  })
                "
                @click="removeCollaborator(row.id)"
              >
                <i class="icon-[lucide--x] size-4" />
              </Button>
            </li>
          </ul>
        </section>

        <footer class="flex shrink-0 justify-end gap-2 pt-1">
          <Button variant="muted-textonly" size="md" @click="$emit('close')">
            {{ t('prototype.views.projects.newProjectDialog.cancel') }}
          </Button>
          <Button
            variant="primary"
            size="md"
            :disabled="!isValid"
            @click="submit"
          >
            {{ t('prototype.views.projects.newProjectDialog.create') }}
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import TierDropdown from './TierDropdown.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { ProjectTier } from '../types'

const emit = defineEmits<{
  close: []
  created: [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

const name = ref('')
const tier = ref<ProjectTier>('workspace-wide')
const collaborators = ref<string[]>([])

const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
onMounted(() => nameInput.value?.focus())

const searchQuery = ref('')
const pickerOpen = ref(false)
const pickerRef = useTemplateRef<HTMLElement>('pickerRef')
onClickOutside(pickerRef, () => {
  pickerOpen.value = false
})

const workspaceName = computed(() => currentWorkspace.value?.name ?? '')

const tierLabel = computed(() =>
  t(`prototype.views.project.sharing.tier.${tier.value}.label`, {
    workspace: workspaceName.value
  })
)
const tierDescription = computed(() =>
  t(`prototype.views.project.sharing.tier.${tier.value}.description`)
)
const tierIcon = computed(() =>
  tier.value === 'workspace-wide'
    ? 'icon-[lucide--globe] size-5 text-muted-foreground'
    : 'icon-[lucide--lock] size-5 text-muted-foreground'
)

const pickerCandidates = computed(() => {
  const taken = new Set([fixture.value.currentUser.id, ...collaborators.value])
  const query = searchQuery.value.trim().toLowerCase()
  return fixture.value.members
    .filter((m) => !taken.has(m.id))
    .filter(
      (m) =>
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    )
    .slice(0, 8)
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarColor: m.avatarColor ?? '#7c7c7c',
      initial: m.name.trim().charAt(0).toUpperCase()
    }))
})

const collaboratorRows = computed(() =>
  collaborators.value.map((id) => {
    const m = fixture.value.members.find((wm) => wm.id === id)
    const displayName = m?.name ?? id
    return {
      id,
      name: displayName,
      email: m?.email ?? '',
      avatarColor: m?.avatarColor ?? '#7c7c7c',
      initial: displayName.trim().charAt(0).toUpperCase()
    }
  })
)

function addCollaborator(userId: string) {
  if (!collaborators.value.includes(userId)) {
    collaborators.value = [...collaborators.value, userId]
  }
  searchQuery.value = ''
  pickerOpen.value = false
}

function onEnterSubmit() {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return
  const exact = pickerCandidates.value.find(
    (c) => c.email.toLowerCase() === query || c.name.toLowerCase() === query
  )
  if (exact) addCollaborator(exact.id)
}

function removeCollaborator(userId: string) {
  collaborators.value = collaborators.value.filter((id) => id !== userId)
}

const isValid = computed(() => name.value.trim().length > 0)

function submit() {
  if (!isValid.value) return
  const id = personaStore.createProject(
    name.value,
    tier.value,
    tier.value === 'restricted' ? collaborators.value : []
  )
  emit('created', id)
}
</script>
