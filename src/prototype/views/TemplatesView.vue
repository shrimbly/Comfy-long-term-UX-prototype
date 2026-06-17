<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md — the ComfyUI template gallery
    log:    ../prototype/design-decisions.md (2026-06-17 — Templates restored;
            2026-06-18 — categorization/filter/sort modeled on the production
            templates library + ComfyHub)

  Templates gallery. Reuses the established list-toolbar pattern (Projects /
  Recents): a generation-type chip row on the left; search + Use Case + Runtime
  filters and a Sort dropdown on the right. We can't add a second sidebar, so
  the production library's left-rail category tree becomes the chip row here.
-->
<template>
  <div class="flex flex-col gap-6">
    <header>
      <PageTitle>{{ t('prototype.views.templates.title') }}</PageTitle>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <label
          class="flex h-8 items-center gap-2 rounded-lg border border-border-default bg-secondary-background px-3 transition-colors focus-within:border-muted-foreground"
        >
          <i
            class="icon-[lucide--search] size-3.5 shrink-0 text-muted-foreground"
          />
          <input
            v-model="query"
            type="text"
            :placeholder="t('prototype.views.templates.searchPlaceholder')"
            :aria-label="t('prototype.views.templates.searchPlaceholder')"
            class="w-36 min-w-0 bg-transparent text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <FilterPill
          :label="t('prototype.views.templates.allCategories')"
          :active="category === 'all'"
          @click="category = 'all'"
        />
        <FilterPill
          v-for="c in presentCategories"
          :key="c"
          :label="t(`prototype.templateCategory.${c}`)"
          :active="category === c"
          @click="category = c"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <ToolbarSelect
          v-model="runtime"
          :options="runtimeOptions"
          :aria-label="t('prototype.views.templates.runtimeLabel')"
        />
        <ToolbarSelect
          v-model="sort"
          :options="sortOptions"
          :aria-label="t('prototype.views.templates.sortLabel')"
        />
      </div>
    </div>

    <div
      v-if="sortedTemplates.length"
      class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6"
    >
      <TemplateCard
        v-for="tpl in sortedTemplates"
        :key="tpl.id"
        :template="tpl"
      />
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ t('prototype.views.templates.empty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FilterPill from '../components/FilterPill.vue'
import PageTitle from '../components/PageTitle.vue'
import TemplateCard from '../components/TemplateCard.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import { workflowTemplates } from '../fixtures/templates'
import type { TemplateCategory } from '../types'

type CategoryFilter = TemplateCategory | 'all'
type RuntimeFilter = 'all' | 'comfyui' | 'api'
type SortValue = 'recommended' | 'popular' | 'newest' | 'az'

const { t } = useI18n()

const category = ref<CategoryFilter>('all')
const runtime = ref<RuntimeFilter>('all')
const sort = ref<SortValue>('recommended')
const query = ref('')

const categoryOrder: TemplateCategory[] = [
  'image',
  'video',
  'audio',
  '3d',
  'llm',
  'utility'
]

const presentCategories = computed(() =>
  categoryOrder.filter((c) =>
    workflowTemplates.some((tpl) => tpl.category === c)
  )
)

const runtimeOptions = computed<Array<{ value: RuntimeFilter; label: string }>>(
  () => [
    { value: 'all', label: t('prototype.views.templates.runtime.all') },
    { value: 'comfyui', label: t('prototype.views.templates.runtime.comfyui') },
    { value: 'api', label: t('prototype.views.templates.runtime.api') }
  ]
)

const sortOptions = computed<Array<{ value: SortValue; label: string }>>(() => [
  {
    value: 'recommended',
    label: t('prototype.views.templates.sort.recommended')
  },
  { value: 'popular', label: t('prototype.views.templates.sort.popular') },
  { value: 'newest', label: t('prototype.views.templates.sort.newest') },
  { value: 'az', label: t('prototype.views.templates.sort.az') }
])

const filteredTemplates = computed(() => {
  const q = query.value.trim().toLowerCase()
  return workflowTemplates.filter((tpl) => {
    if (category.value !== 'all' && tpl.category !== category.value)
      return false
    if (runtime.value !== 'all' && tpl.runtime !== runtime.value) return false
    if (
      q &&
      !`${tpl.name} ${tpl.model} ${tpl.description} ${tpl.useCases.join(' ')}`
        .toLowerCase()
        .includes(q)
    )
      return false
    return true
  })
})

const sortedTemplates = computed(() => {
  const list = [...filteredTemplates.value]
  switch (sort.value) {
    case 'popular':
      return list.sort((a, b) => b.popularity - a.popularity)
    case 'newest':
      return list.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    case 'az':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'recommended':
    default:
      return list
  }
})
</script>
