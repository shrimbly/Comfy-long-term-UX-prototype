<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    decision: ../IA_Plan/wiki/decisions/cloud-only-permissions.md — a
              project can only narrow the workspace's allowlists
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment
              end to end: items, impact, update or fork"

  Edit the custom nodes or the models a deployment pins. Remove with the
  x; add from what the workspace policies allow. Nothing is saved until
  the deployment rebuilds.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">
    {{ title }}
  </h2>
  <p class="m-0 text-sm text-muted-foreground">
    {{ t('prototype.customCloud.dialog.items.hint') }}
  </p>

  <ul
    v-if="items.length"
    class="m-0 flex list-none flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle p-0 text-sm"
  >
    <li
      v-for="item in items"
      :key="item.id"
      class="flex items-center justify-between gap-3 py-2 pr-2 pl-4"
    >
      <span class="flex min-w-0 flex-col">
        <span class="truncate">{{ item.name }}</span>
        <span
          v-if="item.name !== item.id"
          class="truncate font-mono text-xs text-muted-foreground"
        >
          {{ item.id }}
        </span>
      </span>
      <Button
        variant="muted-textonly"
        size="icon-sm"
        :aria-label="
          t('prototype.customCloud.dialog.items.remove', { name: item.name })
        "
        @click="remove(item.id)"
      >
        <i class="icon-[lucide--x] size-4" />
      </Button>
    </li>
  </ul>
  <p v-else class="m-0 text-sm text-muted-foreground">
    {{ t('prototype.customCloud.dialog.items.empty') }}
  </p>

  <div class="flex flex-col gap-2">
    <label
      class="flex h-10 items-center gap-2 rounded-lg border border-border-subtle bg-base-background px-3 focus-within:border-base-foreground"
    >
      <i class="icon-[lucide--plus] size-4 shrink-0 text-muted-foreground" />
      <input
        v-model="query"
        type="text"
        :placeholder="addPlaceholder"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        @keydown.enter.prevent="addFirst"
      />
    </label>
    <div
      v-if="candidates.length"
      class="flex max-h-44 flex-col overflow-y-auto rounded-lg bg-secondary-background/40 p-1"
    >
      <Button
        v-for="candidate in candidates"
        :key="candidate.id"
        variant="textonly"
        size="unset"
        class="w-full justify-between gap-3 rounded-md px-2 py-1.5 text-left font-normal"
        @click="add(candidate.id)"
      >
        <span class="flex items-center gap-2 truncate text-sm">
          <i class="icon-[lucide--plus] size-3.5 text-muted-foreground" />
          {{ candidate.name }}
        </span>
        <span class="truncate font-mono text-xs text-muted-foreground">
          {{ candidate.id }}
        </span>
      </Button>
    </div>
    <p v-else class="m-0 px-1 text-xs text-muted-foreground">
      {{
        t(
          query
            ? 'prototype.customCloud.dialog.items.noMatches'
            : 'prototype.customCloud.dialog.items.allAdded'
        )
      }}
    </p>
  </div>

  <footer class="flex items-center gap-2.5">
    <span class="mr-auto text-xs text-muted-foreground">
      {{ t('prototype.customCloud.dialog.items.allowedNote') }}
    </span>
    <Button
      variant="inverted"
      size="lg"
      @click="customCloud.editStep = 'config'"
    >
      {{ t('prototype.customCloud.dialog.items.done') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePolicyStore } from '../stores/policyStore'

const { titleId } = defineProps<{
  titleId: string
}>()

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const policies = usePrototypePolicyStore()

const query = ref('')

const kind = computed(() => customCloud.editingItemsKind)

const title = computed(() =>
  t(
    kind.value === 'nodes'
      ? 'prototype.customCloud.dialog.build.customNodes'
      : 'prototype.customCloud.dialog.build.openSourceModels'
  )
)
const addPlaceholder = computed(() =>
  t(
    kind.value === 'nodes'
      ? 'prototype.customCloud.dialog.items.addNodes'
      : 'prototype.customCloud.dialog.items.addModels'
  )
)

const ids = computed(() =>
  kind.value === 'nodes'
    ? customCloud.editingNodePacks
    : customCloud.editingModels
)

function nameOf(id: string) {
  return policies.catalog.find((item) => item.id === id)?.name ?? id
}

const items = computed(() => ids.value.map((id) => ({ id, name: nameOf(id) })))

// What the workspace allows, minus what is already pinned.
const candidates = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return policies.catalog
    .filter(
      (item) =>
        item.kind === kind.value &&
        policies.isAllowed(item.id) &&
        !ids.value.includes(item.id) &&
        (!needle ||
          item.name.toLowerCase().includes(needle) ||
          item.id.includes(needle))
    )
    .map((item) => ({ id: item.id, name: item.name }))
})

function setIds(next: string[]) {
  if (kind.value === 'nodes') customCloud.editingNodePacks = next
  else customCloud.editingModels = next
}

function add(id: string) {
  setIds([...ids.value, id])
  query.value = ''
}

function addFirst() {
  const first = candidates.value[0]
  if (first) add(first.id)
}

function remove(id: string) {
  setIds(ids.value.filter((item) => item !== id))
}
</script>
