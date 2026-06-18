<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level

  Compact access indicator shown on project cards. Replaces the old tier text
  badge: a limited project shows the avatar stack of who has access, an
  everyone (workspace-wide) project shows "Everyone", and a private project
  (limited with nobody else shared) shows "Private".
-->
<template>
  <span
    v-if="accessLevel === 'limited'"
    class="flex shrink-0 items-center"
    :title="
      t('prototype.views.project.sharing.peopleCount', { count: peopleCount })
    "
  >
    <span
      v-for="(a, i) in visibleAvatars"
      :key="a.userId"
      :class="
        cn(
          'grid size-6 place-items-center rounded-full border-2 border-secondary-background text-[10px] font-semibold text-button-surface-contrast',
          i > 0 && '-ml-2'
        )
      "
      :style="{ backgroundColor: a.avatarColor }"
      :title="a.name"
    >
      {{ a.initial }}
    </span>
    <span
      v-if="hiddenAvatarCount > 0"
      class="-ml-2 grid size-6 place-items-center rounded-full border-2 border-secondary-background bg-secondary-background-hover text-[10px] font-semibold text-muted-foreground"
    >
      {{
        t('prototype.views.project.sharing.summaryMore', {
          count: hiddenAvatarCount
        })
      }}
    </span>
  </span>

  <span
    v-else
    class="shrink-0 rounded-full bg-secondary-background-hover px-2 py-0.5 text-xs text-muted-foreground"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useProjectAccess } from '../composables/useProjectAccess'
import type { Project } from '../types'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()

const { accessLevel, visibleAvatars, hiddenAvatarCount, peopleCount } =
  useProjectAccess(() => project)

const label = computed(() =>
  accessLevel.value === 'private'
    ? t('prototype.projectAccess.private')
    : t('prototype.projectAccess.everyone')
)
</script>
