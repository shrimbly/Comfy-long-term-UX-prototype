<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md — the ComfyUI template gallery
    log:    ../prototype/design-decisions.md (2026-06-17 — Templates restored)

  Templates gallery. A 4-up grid of template cards with a Type (category)
  filter. Templates are a pre-existing shipping feature, independent of the
  deferred Hub — see the 2026-06-17 design-decisions entry.
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between gap-3">
      <PageTitle>{{ t('prototype.views.templates.title') }}</PageTitle>
      <ToolbarSelect
        v-model="categoryFilter"
        :options="categoryOptions"
        :aria-label="t('prototype.views.templates.typeFilterLabel')"
      />
    </header>

    <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      <ShowcaseCard
        v-for="tpl in filteredTemplates"
        :key="tpl.id"
        :title="tpl.name"
        :subtitle="tpl.author"
        :seed="tpl.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PageTitle from '../components/PageTitle.vue'
import ShowcaseCard from '../components/ShowcaseCard.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import { workflowTemplates } from '../fixtures/templates'

const { t } = useI18n()

const categoryFilter = ref<string>('all')

const presentCategories = computed(() => [
  ...new Set(workflowTemplates.map((tpl) => tpl.category))
])

const categoryOptions = computed(() => [
  { value: 'all', label: t('prototype.views.templates.allTypes') },
  ...presentCategories.value.map((category) => ({
    value: category,
    label: t(`prototype.templateCategory.${category}`)
  }))
])

const filteredTemplates = computed(() =>
  categoryFilter.value === 'all'
    ? workflowTemplates
    : workflowTemplates.filter((tpl) => tpl.category === categoryFilter.value)
)
</script>
