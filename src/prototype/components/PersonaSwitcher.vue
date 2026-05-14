<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/personas-and-flows.md

  Dev-only persona toggle.
-->
<template>
  <label class="flex items-center gap-2 text-xs">
    <span class="text-muted-foreground">{{
      t('prototype.persona.label')
    }}</span>
    <select
      v-model="selected"
      class="cursor-pointer rounded-md bg-secondary-background px-2 py-1 text-xs text-base-foreground"
    >
      <option v-for="p in personas" :key="p.id" :value="p.id">
        {{ p.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { personas } = personaStore

const selected = computed({
  get: () => personaStore.currentPersonaId,
  set: (v) => personaStore.setPersona(v)
})
</script>
