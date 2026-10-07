<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment:
              its own dialog, two modes, a change counter"

  Configuration mode of Edit deployment: name and ComfyUI version edit in
  place; models and custom nodes open their lists. A changed row says so.
-->
<template>
  <div
    class="flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-1"
  >
    <label :class="rowClass">
      <span class="flex items-center gap-2 text-muted-foreground">
        {{ t('prototype.customCloud.edit.name') }}
        <ChangedBadge v-if="changes.name" />
      </span>
      <span class="flex min-w-0 items-center gap-2">
        <input
          v-model="customCloud.newDeploymentName"
          type="text"
          class="field-sizing-content min-w-0 border-0 bg-transparent p-0 text-right text-sm text-base-foreground outline-none focus:underline"
        />
        <i class="icon-[lucide--pencil] size-3.5 text-muted-foreground" />
      </span>
    </label>

    <label :class="cn(rowClass, 'border-t border-border-subtle')">
      <span class="flex items-center gap-2 text-muted-foreground">
        {{ t('prototype.customCloud.edit.comfyui') }}
        <ChangedBadge v-if="changes.comfyVersion" />
      </span>
      <span class="flex items-center gap-2">
        <select
          v-model="customCloud.editingComfyVersion"
          class="border-0 bg-transparent p-0 text-right text-sm text-base-foreground outline-none"
        >
          <option v-for="version in COMFY_VERSIONS" :key="version">
            {{ version }}
          </option>
        </select>
        <span
          v-if="customCloud.editingComfyVersion === COMFY_VERSIONS[0]"
          class="text-xs text-muted-foreground"
        >
          {{ t('prototype.customCloud.edit.latestStable') }}
        </span>
        <i class="icon-[lucide--pencil] size-3.5 text-muted-foreground" />
      </span>
    </label>

    <div :class="cn(rowClass, 'border-t border-border-subtle')">
      <span class="text-muted-foreground">
        {{ t('prototype.customCloud.edit.runtime') }}
      </span>
      <span class="flex min-w-0 items-center gap-2">
        <span class="truncate">{{ runtime }}</span>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.customCloud.edit.runtimeLocked') }}
        </span>
      </span>
    </div>

    <Button
      v-for="list in lists"
      :key="list.kind"
      variant="textonly"
      size="unset"
      :class="
        cn(
          rowClass,
          'w-full justify-between rounded-none border-t border-border-subtle font-normal'
        )
      "
      @click="openItems(list.kind)"
    >
      <span class="flex items-center gap-2 text-muted-foreground">
        {{ list.label }}
        <ChangedBadge v-if="list.changed" />
      </span>
      <span class="flex items-center gap-2">
        {{ list.value }}
        <i
          class="icon-[lucide--chevron-right] size-3.5 text-muted-foreground"
        />
      </span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { BUILD_DEFAULTS, COMFY_VERSIONS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

import ChangedBadge from './EditDeploymentChangedBadge.vue'

const rowClass = 'flex h-11.5 items-center justify-between gap-3 px-3 text-sm'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const changes = computed(() => customCloud.editingChanges)
const runtime = computed(
  () => customCloud.editingDeployment?.runtime ?? BUILD_DEFAULTS.runtime
)

const lists = computed(() => [
  {
    kind: 'models' as const,
    label: t('prototype.customCloud.edit.models'),
    value: t(
      'prototype.customCloud.edit.modelsCount',
      customCloud.editingModels.length
    ),
    changed:
      changes.value.addedModels.length > 0 ||
      changes.value.removedModels.length > 0
  },
  {
    kind: 'nodes' as const,
    label: t('prototype.customCloud.edit.customNodes'),
    value: t(
      'prototype.customCloud.edit.packsCount',
      customCloud.editingNodePacks.length
    ),
    changed:
      changes.value.addedPacks.length > 0 ||
      changes.value.removedPacks.length > 0
  }
])

function openItems(kind: 'nodes' | 'models') {
  customCloud.editingItemsKind = kind
  customCloud.editStep = 'items'
}
</script>
