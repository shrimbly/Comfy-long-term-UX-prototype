<!--
  Design review, not product UI: four static mock-ups of the Edit
  deployment dialog, side by side, to pick how its two modes
  (configuration, machine) read. Reached at /prototype/design/edit-deployment.
  Option D is the one built (EditDeploymentDialog.vue).
-->
<template>
  <div class="min-h-screen bg-black/90 p-10 text-base-foreground">
    <h1 class="m-0 mb-1 text-2xl font-semibold">{{ copy.pageTitle }}</h1>
    <p class="m-0 mb-8 text-sm text-muted-foreground">{{ copy.pageHint }}</p>

    <div class="grid grid-cols-2 gap-10 max-xl:grid-cols-1">
      <section
        v-for="option in options"
        :key="option.id"
        class="flex flex-col gap-3"
      >
        <header class="flex items-baseline gap-3">
          <span
            class="grid size-7 place-items-center rounded-full bg-base-foreground text-sm font-semibold text-base-background"
          >
            {{ option.id }}
          </span>
          <span class="text-base font-medium">{{ option.title }}</span>
          <span class="text-sm text-muted-foreground">{{ option.sub }}</span>
        </header>

        <div :class="dialogClass">
          <h2 class="m-0 text-2xl font-semibold">{{ copy.title }}</h2>
          <p class="m-0 -mt-4 text-sm text-muted-foreground">{{ copy.who }}</p>

          <!-- A: stepper -->
          <template v-if="option.id === 'A'">
            <ol class="m-0 flex list-none items-center gap-3 p-0 text-sm">
              <li
                v-for="(s, i) in copy.steps"
                :key="s"
                class="flex items-center gap-2"
              >
                <span
                  :class="
                    cn(
                      'grid size-6 place-items-center rounded-full text-xs font-semibold',
                      i === 0
                        ? 'bg-base-foreground text-base-background'
                        : 'border border-border-default text-muted-foreground'
                    )
                  "
                >
                  {{ i + 1 }}
                </span>
                <span :class="i === 0 ? '' : 'text-muted-foreground'">
                  {{ s }}
                </span>
                <i
                  v-if="i < copy.steps.length - 1"
                  class="ml-1 icon-[lucide--chevron-right] size-3.5 text-muted-foreground"
                />
              </li>
            </ol>
            <MockConfigCard />
            <footer class="flex items-center gap-2.5">
              <span :class="ghostBtn" class="mr-auto">{{ copy.cancel }}</span>
              <span :class="primaryBtn">{{ copy.nextMachine }}</span>
            </footer>
          </template>

          <!-- B: one page, two cards -->
          <template v-else-if="option.id === 'B'">
            <div class="flex flex-col gap-2">
              <span :class="eyebrow">{{ copy.modeConfig }}</span>
              <MockConfigCard />
            </div>
            <div class="flex flex-col gap-2">
              <span :class="eyebrow">{{ copy.modeMachine }}</span>
              <MockMachineCard compact />
            </div>
            <footer class="flex items-center gap-2.5">
              <span :class="ghostBtn" class="mr-auto">{{ copy.cancel }}</span>
              <span :class="disabledBtn">{{ copy.noChanges }}</span>
            </footer>
          </template>

          <!-- C: pick first -->
          <template v-else-if="option.id === 'C'">
            <p class="m-0 text-sm">{{ copy.pickQuestion }}</p>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="tile in copy.tiles"
                :key="tile.title"
                class="flex flex-col gap-2 rounded-xl border border-border-subtle bg-secondary-background/40 p-4"
              >
                <i :class="cn(tile.icon, 'size-5 text-muted-foreground')" />
                <span class="text-sm font-medium">{{ tile.title }}</span>
                <span class="text-xs text-muted-foreground">{{
                  tile.hint
                }}</span>
                <span class="mt-2 text-xs text-muted-foreground">
                  {{ tile.current }}
                </span>
              </div>
            </div>
            <footer class="flex items-center gap-2.5">
              <span :class="ghostBtn" class="mr-auto">{{ copy.cancel }}</span>
            </footer>
          </template>

          <!-- D: segmented modes + counter (built) -->
          <template v-else>
            <div
              class="grid grid-cols-2 gap-1 rounded-xl bg-secondary-background/40 p-1"
            >
              <span
                class="flex flex-col gap-0.5 rounded-lg border border-base-foreground bg-base-background px-3 py-2"
              >
                <span class="text-sm font-medium">{{ copy.modeConfig }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ copy.modeConfigHint }}
                </span>
              </span>
              <span class="flex flex-col gap-0.5 rounded-lg px-3 py-2">
                <span class="flex items-center gap-2 text-sm font-medium">
                  {{ copy.modeMachine }}
                  <span
                    class="rounded-full bg-base-foreground px-1.5 text-[11px] text-base-background"
                  >
                    1
                  </span>
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ copy.modeMachineHint }}
                </span>
              </span>
            </div>
            <MockConfigCard />
            <footer class="flex items-center gap-2.5">
              <span :class="ghostBtn" class="mr-auto">{{ copy.cancel }}</span>
              <span :class="outlineBtn">{{ copy.nextMachine }}</span>
              <span :class="primaryBtn">{{ copy.reviewOne }}</span>
            </footer>
          </template>
        </div>

        <p class="m-0 text-sm text-muted-foreground">{{ option.note }}</p>
      </section>
    </div>

    <section class="mt-12 flex flex-col gap-3">
      <header class="flex items-baseline gap-3">
        <span class="text-base font-medium">{{ copy.reviewTitle }}</span>
        <span class="text-sm text-muted-foreground">{{ copy.reviewSub }}</span>
      </header>
      <div :class="cn(dialogClass, 'max-w-[640px]')">
        <h2 class="m-0 text-2xl font-semibold">{{ copy.reviewHeading }}</h2>
        <p class="m-0 -mt-4 text-sm text-muted-foreground">
          {{ copy.reviewAffects }}
        </p>
        <ul
          class="m-0 flex list-none flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle p-0 text-sm"
        >
          <li class="flex items-center gap-3 px-4 py-2.5">
            <span
              class="grid size-4 place-items-center rounded-sm bg-destructive-background text-[9px] font-semibold"
            >
              C
            </span>
            <span>{{ copy.project }}</span>
            <span class="ml-auto text-xs text-muted-foreground">
              {{ copy.thisProject }}
            </span>
          </li>
        </ul>
        <div class="flex flex-col gap-2">
          <span :class="eyebrow">{{ copy.changes }}</span>
          <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            <li v-for="line in copy.changeLines" :key="line">{{ line }}</li>
          </ul>
        </div>
        <footer class="flex flex-wrap items-center gap-2.5">
          <span :class="ghostBtn" class="mr-auto">{{ copy.cancel }}</span>
          <span :class="outlineBtn">{{ copy.fork }}</span>
          <span :class="primaryBtn">{{ copy.update }}</span>
        </footer>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import MockConfigCard from '../components/design/EditDeploymentMockConfig.vue'
import MockMachineCard from '../components/design/EditDeploymentMockMachine.vue'

const dialogClass =
  'flex flex-col gap-6 rounded-2xl border border-border-default bg-base-background p-8 shadow-2xl'
const eyebrow =
  'text-xs font-medium tracking-widest text-muted-foreground uppercase'
const btn =
  'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium'
const ghostBtn = cn(btn, 'text-muted-foreground')
const outlineBtn = cn(btn, 'border border-border-default')
const primaryBtn = cn(btn, 'bg-base-foreground text-base-background')
const disabledBtn = cn(btn, 'bg-secondary-background text-muted-foreground')

const copy = {
  pageTitle: 'Edit deployment: four ways to show its two modes',
  pageHint:
    'Static mock-ups for review. D is what the prototype runs today. The review step at the bottom is shared by all four.',
  title: 'Edit deployment',
  who: 'Acme Studio pipeline v3 · Used by 1 project',
  steps: ['Configuration', 'Machine', 'Review'],
  modeConfig: 'Configuration',
  modeConfigHint: 'ComfyUI, custom nodes, models',
  modeMachine: 'Machine',
  modeMachineHint: 'GPU, keep warm',
  cancel: 'Cancel',
  nextMachine: 'Next: machine',
  noChanges: 'Nothing changed yet',
  reviewOne: 'Review 1 change',
  pickQuestion: 'What do you want to change?',
  tiles: [
    {
      icon: 'icon-[lucide--sliders-horizontal]',
      title: 'Configuration',
      hint: 'ComfyUI version, custom nodes, models',
      current: 'v0.39.1 · 3 packs · 3 models'
    },
    {
      icon: 'icon-[lucide--cpu]',
      title: 'Machine',
      hint: 'GPU and how long it stays warm',
      current: 'RTX PRO 6000 · 2 min'
    }
  ],
  reviewTitle: 'Review step',
  reviewSub: 'Same for A to D. Three ways out.',
  reviewHeading: 'Review changes to Acme Studio pipeline',
  reviewAffects:
    '1 project runs on it. It gets the new release when the build is done.',
  project: 'Coca-Cola Ad',
  thisProject: 'this project',
  changes: 'Changes',
  changeLines: ['Release v3 → v4', 'GPU RTX PRO 6000 → H100 SXM'],
  fork: 'Create a new deployment and use it for this project',
  update: 'Update the existing deployment'
}

const options = [
  {
    id: 'A',
    title: 'Stepper',
    sub: 'three numbered steps, one screen each',
    note: 'Clearest about order. Slowest for a GPU-only change: configuration comes first every time.'
  },
  {
    id: 'B',
    title: 'One page, two cards',
    sub: 'both modes visible, one footer',
    note: 'Nothing hidden, badges mark what changed. Runs past one laptop screen once the GPU table is in.'
  },
  {
    id: 'C',
    title: 'Pick first',
    sub: 'choose a mode, edit one thing, review',
    note: 'The two modes are the first thing you see. Changing both means coming back to this screen.'
  },
  {
    id: 'D',
    title: 'Segmented modes with a change counter',
    sub: 'built in the prototype',
    note: 'Switch modes in any order; each tab counts its changes; Review stays off until there is one.'
  }
]
</script>
