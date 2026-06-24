<!--
  The custom drag image shown while dragging workflow card(s) onto a folder.
  On drag start it appears at the source card's size, then its thumbnail
  collapses away so only the card's text area follows the cursor. A multi-drag
  collapses the same way but its detail reads "{n} workflows". Mounted once
  (Dashboard) and teleported to the body so it floats above everything.
-->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pointer-events-none fixed z-100 overflow-hidden rounded-xl border border-border-subtle bg-secondary-background text-base-foreground shadow-lg"
      :style="{
        left: `${pointer.x + 12}px`,
        top: `${pointer.y + 12}px`,
        width: `${width}px`
      }"
    >
      <div
        class="overflow-hidden transition-all duration-150 ease-out"
        :style="{
          height: `${collapsed ? 0 : thumbHeight}px`,
          opacity: collapsed ? 0 : 1
        }"
      >
        <div
          class="size-full bg-secondary-background-hover"
          :style="thumbBackground ? { background: thumbBackground } : undefined"
        />
      </div>
      <div class="flex flex-col gap-1 px-3 py-2.5">
        <span class="truncate text-xs/tight font-medium">{{
          primaryLabel
        }}</span>
        <span
          v-if="secondaryLabel"
          class="truncate text-xs text-muted-foreground"
          >{{ secondaryLabel }}</span
        >
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useWorkflowDrag } from '../composables/useWorkflowDrag'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { draggingWorkflowIds, ghostGeometry, pointer, updatePointer } =
  useWorkflowDrag()

const visible = computed(
  () => draggingWorkflowIds.value.length > 0 && ghostGeometry.value !== null
)
const width = computed(() => ghostGeometry.value?.width ?? 0)
const thumbHeight = computed(() => ghostGeometry.value?.thumbHeight ?? 0)

const count = computed(() => draggingWorkflowIds.value.length)
const isMulti = computed(() => count.value > 1)

const single = computed(() =>
  count.value === 1
    ? personaStore.fixture.workflows.find(
        (w) => w.id === draggingWorkflowIds.value[0]
      )
    : undefined
)

const primaryLabel = computed(() =>
  isMulti.value
    ? t('prototype.dragGhost.count', { count: count.value })
    : (single.value?.name ?? '')
)
const secondaryLabel = computed(() =>
  isMulti.value ? '' : (single.value?.updatedAt ?? '')
)

const thumbBackground = computed(() =>
  single.value ? personaStore.resolveWorkflowThumbnail(single.value) : undefined
)

// Collapse the thumbnail one frame after the ghost appears, so its full-card
// height paints first and the height transition actually runs.
const collapsed = ref(false)
watch(visible, (shown) => {
  collapsed.value = false
  if (!shown) return
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      collapsed.value = true
    })
  )
})

function onDragOver(event: DragEvent) {
  if (!draggingWorkflowIds.value.length) return
  updatePointer(event.clientX, event.clientY)
}

onMounted(() => document.addEventListener('dragover', onDragOver))
onBeforeUnmount(() => document.removeEventListener('dragover', onDragOver))
</script>
