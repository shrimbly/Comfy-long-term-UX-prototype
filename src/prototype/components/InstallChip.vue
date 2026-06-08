<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/install-switcher.md
    entity:   ../IA_Plan/wiki/entities/install.md
    open-q:   ../IA_Plan/wiki/open-questions.md#install-indicator-placement
              — working placement (this prototype): top bar, beside the
              notifications bell.
    log:      ../prototype/design-decisions.md
              — A1 working stance: switching records active install only;
              tab-set swap behavior is deferred to A2.

  Top-bar chip surfacing the active install and a popover for switching.
  Hidden when the persona has no installs (cloud-only). Switching the
  active install changes the runtime in product reality; in the
  prototype it's purely a state update — the gate/attribution UX that
  reacts to it lands in A2.
-->
<template>
  <div v-if="hasInstalls" ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-7 cursor-pointer appearance-none items-center gap-1.5 rounded-sm border-0 bg-transparent px-1.5 text-sm text-base-foreground transition-colors hover:bg-secondary-background focus:outline-none"
      :title="t('prototype.installChip.tooltip')"
      :aria-label="t('prototype.installChip.ariaLabel')"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span
        class="icon-[lucide--monitor] size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span class="max-w-32 truncate text-xs">{{ activeName }}</span>
      <span
        class="icon-[lucide--chevron-down] size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 z-20 mt-1 flex w-72 flex-col rounded-lg border border-border-default bg-interface-menu-surface text-sm text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <header
        class="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2"
      >
        <span class="font-medium">
          {{ t('prototype.installChip.title') }}
        </span>
      </header>

      <ul class="m-0 flex list-none flex-col p-0">
        <li
          v-for="install in installs"
          :key="install.id"
          class="border-b border-border-default last:border-b-0"
        >
          <button
            type="button"
            :class="
              cn(
                'flex w-full cursor-pointer appearance-none items-start gap-2 border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none',
                install.id === activeId &&
                  'bg-interface-menu-component-surface-hovered'
              )
            "
            :aria-current="install.id === activeId ? 'true' : undefined"
            @click="onSelect(install.id)"
          >
            <span
              v-if="install.id === activeId"
              class="mt-0.5 icon-[lucide--check] size-3.5 shrink-0 text-primary-background"
              aria-hidden="true"
            />
            <span v-else class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-sm">
                {{ install.displayName }}
              </span>
              <span class="truncate text-xs text-muted-foreground">
                {{
                  t('prototype.installChip.versionLine', {
                    version: install.comfyUIVersion
                  })
                }}
              </span>
            </span>
          </button>
        </li>
      </ul>

      <footer
        class="border-t border-border-default px-3 py-2 text-xs text-muted-foreground"
      >
        {{ t('prototype.installChip.aggregationHint') }}
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, activeInstall } = storeToRefs(personaStore)

const isOpen = ref(false)
const containerRef = useTemplateRef<HTMLElement>('containerRef')

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const installs = computed(() => fixture.value.installs)
const hasInstalls = computed(() => installs.value.length > 0)
const activeId = computed(() => fixture.value.activeInstallId)
const activeName = computed(
  () => activeInstall.value?.displayName ?? t('prototype.installChip.noActive')
)

function onSelect(id: string) {
  personaStore.setActiveInstall(id)
  isOpen.value = false
}
</script>
