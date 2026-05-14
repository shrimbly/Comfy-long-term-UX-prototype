<!--
  Modal wrapper around <ProjectSharing>. Modeled on InviteMemberDialog's
  Teleport + click-outside pattern. Sharing lives behind a button rather
  than inline so the project detail page can focus on content (workflows).
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
        class="my-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <button
          type="button"
          :aria-label="t('prototype.views.project.sharing.close')"
          class="absolute top-4 right-4 grid size-9 cursor-pointer appearance-none place-items-center rounded-lg border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
          @click="$emit('close')"
        >
          <span class="icon-[lucide--x] size-4" />
        </button>
        <ProjectSharing :project="project" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import ProjectSharing from './ProjectSharing.vue'
import type { Project } from '../types'

defineProps<{
  project: Project
}>()

defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
