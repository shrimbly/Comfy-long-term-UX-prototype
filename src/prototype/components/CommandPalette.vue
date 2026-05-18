<!--
  Implements:
    Raycast-style command palette mounted by views/ExploreView.vue —
    the dashboard Explore surface opens this on click of its search
    bar or ⌘/Ctrl + K.

  Commands are static for the prototype — picking one fires a callback
  the host view handles (route push, toast, etc.). Keyboard nav:
    ↑/↓     move selection
    Enter   run highlighted command
    Esc     close
    typing  filters by label/keywords
-->
<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="open"
        class="fixed inset-0 z-1000 flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-[640px] overflow-hidden rounded-2xl border border-interface-stroke bg-secondary-background shadow-2xl"
          @click.stop
        >
          <div
            class="flex items-center gap-3 border-b border-interface-stroke px-4 py-3"
          >
            <Input
              ref="inputEl"
              v-model="query"
              type="text"
              :placeholder="t('prototype.commandPalette.inputPlaceholder')"
              class="h-auto flex-1 rounded-none bg-transparent p-0 text-base focus-visible:ring-0"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter.prevent="runSelected"
              @keydown.esc.prevent="emit('close')"
            />
            <kbd
              class="rounded-md border border-interface-stroke bg-base-background px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {{ t('prototype.commandPalette.escKey') }}
            </kbd>
          </div>

          <div
            ref="listEl"
            class="max-h-[340px] overflow-y-auto p-1.5"
            role="listbox"
          >
            <template v-if="visibleGroups.length === 0">
              <div class="px-3 py-6 text-center text-sm text-muted-foreground">
                {{ t('prototype.commandPalette.empty') }}
              </div>
            </template>
            <template v-else>
              <div
                v-for="group in visibleGroups"
                :key="group.id"
                class="mb-0.5"
              >
                <div
                  class="px-2.5 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {{ group.label }}
                </div>
                <Button
                  v-for="cmd in group.commands"
                  :key="cmd.id"
                  variant="textonly"
                  size="unset"
                  role="option"
                  :aria-selected="cmd.id === selected?.id"
                  :class="
                    cn(
                      'flex w-full items-center justify-start gap-2.5 px-2.5 py-1.5 text-left',
                      cmd.id === selected?.id && 'bg-secondary-background-hover'
                    )
                  "
                  @mouseenter="selectedId = cmd.id"
                  @click="run(cmd)"
                >
                  <span
                    class="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary-background"
                  >
                    <i :class="cn(cmd.icon, 'size-3.5 text-base-foreground')" />
                  </span>
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-sm font-medium">
                      {{ cmd.label }}
                    </span>
                    <span
                      v-if="cmd.hint"
                      class="truncate text-xs text-muted-foreground"
                    >
                      {{ cmd.hint }}
                    </span>
                  </span>
                  <span
                    v-if="cmd.shortcut"
                    class="flex shrink-0 items-center gap-1"
                  >
                    <kbd
                      v-for="(key, idx) in cmd.shortcut"
                      :key="idx"
                      class="rounded-sm border border-interface-stroke bg-secondary-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {{ key }}
                    </kbd>
                  </span>
                </Button>
              </div>
            </template>
          </div>

          <div
            class="flex items-center justify-between border-t border-interface-stroke px-3 py-1.5 text-xs text-muted-foreground"
          >
            <span class="flex items-center gap-1">
              <kbd
                class="rounded-sm border border-interface-stroke bg-base-background px-1.5 py-0.5"
              >
                ↑
              </kbd>
              <kbd
                class="rounded-sm border border-interface-stroke bg-base-background px-1.5 py-0.5"
              >
                ↓
              </kbd>
              {{ t('prototype.commandPalette.navigate') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd
                class="rounded-sm border border-interface-stroke bg-base-background px-1.5 py-0.5"
              >
                ⏎
              </kbd>
              {{ t('prototype.commandPalette.select') }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'

export interface PaletteCommand {
  id: string
  label: string
  hint?: string
  icon: string
  shortcut?: string[]
  keywords?: string[]
  group: string
}

export interface PaletteGroup {
  id: string
  label: string
}

const { open, commands, groups } = defineProps<{
  open: boolean
  commands: PaletteCommand[]
  groups: PaletteGroup[]
}>()

const emit = defineEmits<{
  close: []
  run: [command: PaletteCommand]
}>()

const { t } = useI18n()

const query = ref('')
const selectedId = ref<string | null>(null)
const inputEl = useTemplateRef<InstanceType<typeof Input>>('inputEl')
const listEl = useTemplateRef<HTMLDivElement>('listEl')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands
  return commands.filter((cmd) => {
    const haystack = [cmd.label, cmd.hint, ...(cmd.keywords ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const visibleGroups = computed(() => {
  return groups
    .map((g) => ({
      ...g,
      commands: filtered.value.filter((c) => c.group === g.id)
    }))
    .filter((g) => g.commands.length > 0)
})

const flatCommands = computed(() =>
  visibleGroups.value.flatMap((g) => g.commands)
)

const selected = computed(() => {
  if (selectedId.value) {
    const match = flatCommands.value.find((c) => c.id === selectedId.value)
    if (match) return match
  }
  return flatCommands.value[0] ?? null
})

watch(query, () => {
  selectedId.value = flatCommands.value[0]?.id ?? null
})

watch(
  () => open,
  (isOpen) => {
    if (isOpen) {
      query.value = ''
      selectedId.value = flatCommands.value[0]?.id ?? null
      void nextTick(() => inputEl.value?.focus())
    }
  },
  { immediate: true }
)

function moveSelection(delta: number) {
  const list = flatCommands.value
  if (list.length === 0) return
  const currentIdx = list.findIndex((c) => c.id === selected.value?.id)
  const nextIdx = (currentIdx + delta + list.length) % list.length
  selectedId.value = list[nextIdx]!.id
  void nextTick(() => {
    const node = listEl.value?.querySelector(
      `[role="option"][aria-selected="true"]`
    )
    node?.scrollIntoView({ block: 'nearest' })
  })
}

function run(cmd: PaletteCommand) {
  emit('run', cmd)
}

function runSelected() {
  if (selected.value) run(selected.value)
}
</script>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from > div,
.palette-leave-to > div {
  transform: translateY(-8px) scale(0.98);
}
.palette-enter-active > div,
.palette-leave-active > div {
  transition: transform 180ms ease;
}
</style>
