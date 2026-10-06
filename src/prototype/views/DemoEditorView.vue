<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              steps 4, 7 and 9
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — missing nodes show red; no error toast or Issues panel
    flow:     ../prototype/flows/07-custom-cloud-happy-path.md

  Demo editor. The deployed prototype has no ComfyUI backend, so the real
  GraphView can't boot; this draws a real editor capture instead and puts
  live overlays on it: matte_pass's nodes (red while the project's
  deployment lacks them), the Run button, the run count and the cold-start
  note. Overlay boxes are in capture pixels; the stage scales to fit.
-->
<template>
  <div
    ref="root"
    class="relative min-h-0 flex-1 overflow-hidden"
    :style="{ backgroundColor: CANVAS_BACKGROUND }"
  >
    <div
      class="absolute inset-y-0 left-0 border-r border-interface-stroke bg-base-background"
      :style="{ width: `${SIDEBAR_WIDTH * scale}px` }"
    />

    <div
      class="absolute top-0 left-0 origin-top-left"
      :style="{
        width: `${STAGE_WIDTH}px`,
        height: `${STAGE_HEIGHT}px`,
        transform: `scale(${scale})`
      }"
    >
      <img
        :src="EDITOR_CAPTURE"
        alt=""
        draggable="false"
        class="pointer-events-none absolute left-0 max-w-none select-none"
        :style="{ top: `${-CAPTURE_TOP_BAR}px`, width: `${STAGE_WIDTH}px` }"
      />

      <template v-if="isMattePass">
        <span
          class="absolute bg-charcoal-400"
          :style="box([218, 224, 124, 10])"
        />
        <span
          class="absolute text-[7px]/[9px] whitespace-nowrap text-base-foreground"
          :style="box([220, 224])"
          >{{ diffusionModelFile }}</span
        >
        <span
          class="absolute bg-charcoal-700"
          :style="box([973, 302, 60, 11])"
        />
        <span
          class="absolute text-[7px]/[9px] whitespace-nowrap text-smoke-500"
          :style="box([975, 303])"
          >{{ refineNodeTitle }}</span
        >
        <span
          class="absolute bg-charcoal-600"
          :style="box([962, 326, 150, 24])"
        />

        <template v-if="customCloud.showsMissingNodes">
          <span
            v-for="node in MISSING_NODES"
            :key="node.ring[0]"
            class="absolute rounded-[5px] ring-2 ring-coral-700"
            :style="box(node.ring)"
          />
          <span
            v-for="node in MISSING_NODES"
            :key="`error-${node.ring[0]}`"
            :class="
              cn(
                'absolute flex items-center justify-center gap-0.5 bg-coral-700 text-[6.5px] text-base-foreground',
                node.errorCorners
              )
            "
            :style="box(node.errorTab)"
          >
            {{ t('prototype.customCloud.editor.error') }}
            <i class="icon-[lucide--info] size-[7px]" />
          </span>
          <span
            class="absolute flex items-center justify-center rounded-br-[5px] bg-charcoal-700 text-[6.5px] text-smoke-500"
            :style="box([266, 272, 101, 13])"
          >
            {{ t('prototype.customCloud.editor.showAdvanced') }}
          </span>
        </template>
      </template>

      <span
        v-if="customCloud.runState !== 'idle'"
        class="absolute flex items-center justify-center rounded-lg bg-charcoal-400 text-sm text-base-foreground"
        :style="box([1072, 12, 76, 32])"
      >
        {{ t('prototype.customCloud.editor.active', { count: 1 }) }}
      </span>

      <Button
        variant="textonly"
        size="unset"
        class="absolute rounded-[9px] hover:bg-white/15"
        :style="box([919, 11, 81, 34])"
        :aria-label="t('prototype.customCloud.editor.run')"
        @click="customCloud.run()"
      />

      <div
        v-if="customCloud.runState === 'starting'"
        role="status"
        class="absolute flex flex-col gap-1.5 rounded-lg border border-border-default bg-base-background p-3 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
        :style="box([744, 54, 300])"
      >
        <span class="flex items-center gap-2 text-sm font-medium">
          <i
            class="icon-[lucide--loader-circle] size-4 animate-spin text-muted-foreground"
          />
          {{ t('prototype.customCloud.editor.coldStartTitle') }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.customCloud.editor.coldStartBody') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import dark from '@/assets/palettes/dark.json' with { type: 'json' }
import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeTabsStore } from '../stores/tabsStore'

const EDITOR_CAPTURE = '/prototype-fixtures/editor-capture.png'
const CANVAS_BACKGROUND = dark.colors.litegraph_base.CLEAR_BACKGROUND_COLOR

// The capture is 1280×863 with ComfyUI's own tab bar on top; the prototype
// draws its real tab bar instead, so the stage starts below that strip.
const CAPTURE_TOP_BAR = 38
const STAGE_WIDTH = 1280
const STAGE_HEIGHT = 863 - CAPTURE_TOP_BAR
const SIDEBAR_WIDTH = 55

// Load Diffusion Model (needs flux1-dev-fp8) and AcmeMatteRefine (from
// acme-matte-tools): the node's red ring and its "Error" footer tab, as
// [left, top, width, height] in capture pixels below the tab bar.
const MISSING_NODES = [
  {
    ring: [165, 191, 202, 82],
    errorTab: [165, 272, 101, 13],
    errorCorners: 'rounded-bl-[5px]'
  },
  {
    ring: [959, 300, 156, 233],
    errorTab: [959, 533, 156, 13],
    errorCorners: 'rounded-b-[5px]'
  }
] as const

const diffusionModelFile = 'flux1-dev-fp8.safetensors'
const refineNodeTitle = 'AcmeMatteRefine'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const tabsStore = usePrototypeTabsStore()

const root = useTemplateRef('root')
const { width, height } = useElementSize(root)
const scale = computed(() =>
  width.value && height.value
    ? Math.min(width.value / STAGE_WIDTH, height.value / STAGE_HEIGHT)
    : 1
)

const isMattePass = computed(
  () =>
    tabsStore.openTabs.find((tab) => tab.id === tabsStore.activeTabId)
      ?.workflowKey === 'matte_pass'
)

// [left, top, width?, height?] in capture pixels.
type Rect = readonly [number, number, number?, number?]

function box([left, top, width, height]: Rect) {
  return {
    left: `${left}px`,
    top: `${top}px`,
    ...(width ? { width: `${width}px` } : {}),
    ...(height ? { height: `${height}px` } : {})
  }
}
</script>
