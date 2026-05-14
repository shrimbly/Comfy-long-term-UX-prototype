<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/comfy-hub.md

  Comfy Hub — the single Discover surface. Templates and Hub collapse into
  one concept per the 2026-05-12 design call. Hub items render as
  thumbnail-first cards.
-->
<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-semibold">
        {{ t('prototype.views.hub.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('prototype.views.hub.subtitle') }}
      </p>
    </header>
    <div class="grid grid-cols-3 gap-4">
      <TemplateCard v-for="tpl in templates" :key="tpl.id" :template="tpl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TemplateCard from '../components/TemplateCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const templates = computed(() => personaStore.fixture.templates)
</script>
