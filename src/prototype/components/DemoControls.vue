<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/personas-and-flows.md — persona toggle
    flow:    ../prototype/flows/07-custom-cloud-happy-path.md — presenter
             controls

  Presenter-only controls, folded into one small "Demo" pill so they stay out
  of the way of the editor: pick a persona, open the incompatible matte_pass
  workflow without a real file drop (as is, or as if no deployment ran it
  yet), finish the coding agent's build, and reset the demo. Every prototype store is in memory, so a page
  reload is the reset: back to the seed fixtures, whatever state the demo was
  left in.
-->
<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        size="unset"
        :class="
          cn(
            'h-7 gap-1.5 rounded-full border border-border-subtle px-2.5 text-xs text-muted-foreground shadow-lg hover:text-base-foreground',
            open && 'bg-secondary-background-hover text-base-foreground'
          )
        "
      >
        <i class="icon-[lucide--presentation] size-3.5" />
        {{ t('prototype.customCloud.demo.menu') }}
        <span class="text-base-foreground">{{ currentPersona?.label }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      side="top"
      :side-offset="6"
      class="w-64 rounded-xl border-border-default bg-base-background p-1 shadow-lg"
    >
      <p class="px-2 pt-1.5 pb-1 text-xs text-muted-foreground">
        {{ t('prototype.persona.label') }}
      </p>
      <Button
        v-for="persona in personaStore.personas"
        :key="persona.id"
        variant="textonly"
        size="md"
        class="w-full justify-between font-normal"
        @click="pickPersona(persona.id)"
      >
        {{ persona.label }}
        <i
          v-if="persona.id === personaStore.currentPersonaId"
          class="icon-[lucide--check] size-3.5"
        />
      </Button>
      <template v-if="customCloud.isEnabled">
        <div class="my-1 h-px bg-border-subtle" />
        <Button
          variant="textonly"
          size="md"
          class="w-full justify-start font-normal"
          @click="run(() => customCloud.dropIncompatibleWorkflow())"
        >
          {{ t('prototype.customCloud.demo.drop') }}
        </Button>
        <Button
          variant="textonly"
          size="md"
          class="w-full justify-start font-normal"
          @click="
            run(() =>
              customCloud.dropIncompatibleWorkflow({ nothingRuns: true })
            )
          "
        >
          {{ t('prototype.customCloud.demo.dropNothingRuns') }}
        </Button>
        <Button
          v-if="customCloud.agentWorking"
          variant="textonly"
          size="md"
          class="w-full justify-start font-normal"
          @click="run(() => customCloud.finishAgentBuild())"
        >
          {{ t('prototype.customCloud.demo.finishAgent') }}
        </Button>
      </template>
      <div class="my-1 h-px bg-border-subtle" />
      <Button
        variant="textonly"
        size="md"
        class="w-full justify-start font-normal text-muted-foreground"
        @click="resetDemo"
      >
        <i class="icon-[lucide--rotate-ccw] size-3.5" />
        {{ t('prototype.customCloud.demo.reset') }}
      </Button>
    </PopoverContent>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import PopoverContent from '@/components/ui/popover/PopoverContent.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { PersonaId } from '../types'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const open = ref(false)

const currentPersona = computed(() =>
  personaStore.personas.find((p) => p.id === personaStore.currentPersonaId)
)

function run(action: () => void) {
  open.value = false
  action()
}

function pickPersona(id: PersonaId) {
  run(() => personaStore.setPersona(id))
}

function resetDemo() {
  window.location.reload()
}
</script>
