<!--
  Presenter control beside the persona toggle: pick which project-page
  header to compare. The choice survives a reload.
-->
<template>
  <div class="flex items-center gap-2 text-xs">
    <span class="text-muted-foreground">
      {{ t('prototype.projectPage.variant.label') }}
    </span>
    <div
      role="radiogroup"
      :aria-label="t('prototype.projectPage.variant.label')"
      class="flex items-center gap-0.5 rounded-md bg-base-background p-0.5"
    >
      <button
        v-for="variant in VARIANTS"
        :key="variant"
        type="button"
        role="radio"
        :aria-checked="ui.projectPageVariant === variant"
        :class="
          cn(
            'cursor-pointer rounded-sm px-2 py-1 text-xs transition-colors',
            ui.projectPageVariant === variant
              ? 'bg-secondary-background-hover text-base-foreground'
              : 'text-muted-foreground hover:text-base-foreground'
          )
        "
        @click="ui.projectPageVariant = variant"
      >
        {{ t(`prototype.projectPage.variant.${variant}`) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useI18n } from 'vue-i18n'

import type { ProjectPageVariant } from '../../stores/uiStore'
import { usePrototypeUiStore } from '../../stores/uiStore'

const VARIANTS: ProjectPageVariant[] = ['tabs', 'quiet', 'rail']

const { t } = useI18n()
const ui = usePrototypeUiStore()
</script>
