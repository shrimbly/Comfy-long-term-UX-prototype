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

        <ProjectAccessFields
          v-model:tier="tier"
          v-model:collaborators="collaborators"
          class="flex-1"
        />

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
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ProjectAccessFields from './ProjectAccessFields.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { ProjectTier } from '../types'

const emit = defineEmits<{
  close: []
  created: [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()

const name = ref('')
const tier = ref<ProjectTier>('workspace-wide')
const collaborators = ref<string[]>([])

const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
onMounted(() => nameInput.value?.focus())

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
