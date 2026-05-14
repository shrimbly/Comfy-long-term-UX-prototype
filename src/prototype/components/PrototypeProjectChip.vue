<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
              — workflow-level local/cloud save destination, controlled
              via the project chip on the canvas.
    decision: ../IA_Plan/wiki/decisions/my-workflows-as-default-save-area.md
              — chip's two states (in real project vs My Workflows).

  Prototype-only overlay on the real ComfyUI canvas. Teleports into
  `#graph-canvas-container` (same anchor pattern as HelpCenterPopups).
  Mounted from `GraphView.vue` behind `import.meta.env.DEV`, so it is
  tree-shaken from production builds.

  This is a *mock*: state is local-only, no persona-store reads, no real
  save-destination wiring. Demonstrates the chip's two states + popover.
-->
<template>
  <div
    v-if="anchorReady"
    ref="rootRef"
    class="pointer-events-auto fixed z-9999 select-none"
    :style="{ top: `${chipTop}px`, left: `${chipLeft}px` }"
  >
    <Button
      variant="secondary"
      size="unset"
      class="flex h-10 items-center gap-2 rounded-lg border border-border-default pr-2 pl-2.5 shadow-[1px_1px_8px_0_rgb(0_0_0/0.3)]"
      :aria-expanded="open"
      :aria-haspopup="true"
      @click="open = !open"
    >
      <span
        v-if="inProject"
        class="grid size-7 shrink-0 place-items-center rounded-sm text-button-surface-contrast"
        :style="{ backgroundColor: project.color }"
      >
        <i :class="cn(destinationIconClass, 'size-4')" />
      </span>
      <span
        v-else
        class="grid size-7 shrink-0 place-items-center rounded-sm border border-dashed border-border-default"
      >
        <i :class="cn(destinationIconClass, 'size-4 text-muted-foreground')" />
      </span>
      <span class="truncate text-sm">{{
        inProject ? project.name : t('prototype.editor.projectChip.myWorkflows')
      }}</span>
      <i class="icon-[lucide--chevron-down] size-3 text-muted-foreground" />
    </Button>

    <div
      v-if="open"
      class="absolute top-full left-0 z-20 mt-2 w-72 rounded-lg border border-border-default bg-interface-menu-surface text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
      role="dialog"
    >
      <div class="flex flex-col gap-1 p-3">
        <div class="flex items-center gap-2">
          <span
            v-if="inProject"
            class="grid size-7 shrink-0 place-items-center rounded-sm text-button-surface-contrast"
            :style="{ backgroundColor: project.color }"
          >
            <i :class="cn(destinationIconClass, 'size-4')" />
          </span>
          <span
            v-else
            class="grid size-7 shrink-0 place-items-center rounded-sm border border-dashed border-border-default"
          >
            <i
              :class="cn(destinationIconClass, 'size-4 text-muted-foreground')"
            />
          </span>
          <div class="flex min-w-0 flex-1 flex-col">
            <div class="flex items-center gap-1">
              <span class="truncate text-sm font-medium">
                {{
                  inProject
                    ? project.name
                    : t('prototype.editor.projectChip.myWorkflows')
                }}
              </span>
              <Button
                variant="muted-textonly"
                size="icon-sm"
                :aria-label="
                  inProject
                    ? t('prototype.editor.projectChip.moveToProject')
                    : t('prototype.editor.projectChip.promoteToProject')
                "
                :title="
                  inProject
                    ? t('prototype.editor.projectChip.moveToProject')
                    : t('prototype.editor.projectChip.promoteToProject')
                "
                @click="onPromoteClick"
              >
                <i class="icon-[lucide--arrow-up-right] size-3.5" />
              </Button>
            </div>
            <span class="truncate text-xs text-muted-foreground">
              {{
                inProject
                  ? t('prototype.editor.projectChip.inProject')
                  : t('prototype.editor.projectChip.notInProject')
              }}
            </span>
          </div>
        </div>
      </div>

      <div class="h-px w-full bg-border-default" aria-hidden="true" />

      <div class="flex flex-col gap-2 p-3">
        <span class="text-xs font-medium text-muted-foreground uppercase">
          {{ t('prototype.editor.projectChip.saveOutputs') }}
        </span>
        <div
          class="inline-flex items-center gap-1 rounded-md border border-border-default p-0.5"
        >
          <Button
            :variant="saveDestination === 'local' ? 'secondary' : 'textonly'"
            size="sm"
            class="flex-1"
            @click="saveDestination = 'local'"
          >
            {{ t('prototype.editor.projectChip.saveLocal') }}
          </Button>
          <Button
            :variant="saveDestination === 'cloud' ? 'secondary' : 'textonly'"
            size="sm"
            class="flex-1"
            :disabled="!signedIn"
            :title="
              signedIn
                ? undefined
                : t('prototype.editor.projectChip.cloudSignInHint')
            "
            @click="saveDestination = 'cloud'"
          >
            {{ t('prototype.editor.projectChip.saveCloud') }}
          </Button>
        </div>
        <span class="text-xs text-muted-foreground">
          {{
            saveDestination === 'local'
              ? t('prototype.editor.projectChip.saveLocalHint')
              : inProject
                ? t('prototype.editor.projectChip.saveCloudProjectHint', {
                    project: project.name
                  })
                : t('prototype.editor.projectChip.saveCloudMyWorkflowsHint')
          }}
        </span>
      </div>

      <div class="h-px w-full bg-border-default" aria-hidden="true" />

      <div class="flex flex-col gap-2 p-3">
        <span class="text-[10px] font-medium text-muted-foreground uppercase">
          {{ t('prototype.editor.projectChip.demoLabel') }}
        </span>
        <div
          class="inline-flex items-center gap-1 rounded-md border border-dashed border-border-default p-0.5"
        >
          <Button
            :variant="inProject ? 'secondary' : 'textonly'"
            size="sm"
            class="flex-1"
            @click="inProject = true"
          >
            {{ t('prototype.editor.projectChip.demoInProject') }}
          </Button>
          <Button
            :variant="!inProject ? 'secondary' : 'textonly'"
            size="sm"
            class="flex-1"
            @click="inProject = false"
          >
            {{ t('prototype.editor.projectChip.demoMyWorkflows') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import {
  onClickOutside,
  useElementBounding,
  useMutationObserver
} from '@vueuse/core'
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

const { t } = useI18n()

const project = {
  name: 'Hero Animation Reel',
  color: '#7c5cff'
}
const signedIn = true

const inProject = ref(true)
const saveDestination = ref<'local' | 'cloud'>('local')
const open = ref(false)
const rootRef = useTemplateRef<HTMLElement>('rootRef')

const destinationIconClass = computed(() =>
  saveDestination.value === 'cloud'
    ? 'icon-[lucide--cloud]'
    : 'icon-[lucide--hard-drive]'
)

onClickOutside(rootRef, () => (open.value = false))

function onPromoteClick() {
  open.value = false
}

const GAP_PX = 8
const ANCHOR_SELECTOR = 'button[aria-label="Workflow actions"]'

const anchor = ref<HTMLElement | null>(null)

function findAnchor() {
  anchor.value = document.querySelector<HTMLElement>(ANCHOR_SELECTOR)
}

findAnchor()
if (!anchor.value) {
  useMutationObserver(document.body, findAnchor, {
    childList: true,
    subtree: true
  })
}

const { right, top } = useElementBounding(anchor)

const anchorReady = computed(() => anchor.value !== null && right.value > 0)
const chipLeft = computed(() => right.value + GAP_PX)
const chipTop = computed(() => top.value)

onBeforeUnmount(() => {
  anchor.value = null
})
</script>
