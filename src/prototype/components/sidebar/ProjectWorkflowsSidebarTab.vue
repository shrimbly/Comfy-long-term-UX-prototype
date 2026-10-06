<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)"
              — the project's published workflows and your drafts for it
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
              — the project is "the parent of all"; switching reloads
    decision: ../IA_Plan/wiki/decisions/my-workflows-as-default-save-area.md
    decision: prototype/design-decisions.md — 2026-10-07 "Editor Workflows
              sidebar is about the current project"

  The editor's Workflows sidebar inside /prototype: the current project's
  workflows and templates, with every other project's collapsed under Other projects.
  Built from upstream's sidebar pieces so it reads as part of the editor.
-->
<template>
  <SidebarTabTemplate
    :title="t('sideToolbar.workflows')"
    data-testid="workflows-sidebar"
    class="workflows-sidebar-tab"
  >
    <template #alt-title>
      <span v-if="current" class="ml-2 truncate text-sm text-muted-foreground">
        {{ current.project.name }}
      </span>
    </template>
    <template #header>
      <SidebarTopArea>
        <SearchInput
          v-model="searchQuery"
          :placeholder="
            t('g.searchPlaceholder', { subject: t('sideToolbar.workflows') })
          "
          @search="expandMatches"
        />
      </SidebarTopArea>
    </template>
    <template #body>
      <div class="comfyui-workflows-panel flex flex-col gap-2 pb-4">
        <section
          v-for="{ section, root } in currentTrees"
          :key="section.kind"
          :aria-label="t(SECTION_LABELS[section.kind])"
          class="flex flex-col gap-2"
        >
          <TextDivider
            :text="t(SECTION_LABELS[section.kind])"
            type="dashed"
            class="ml-2"
          />
          <TreeExplorer
            v-if="section.workflows.length"
            v-model:expanded-keys="expandedKeys"
            :root
            :selection-keys="selectionKeys"
          />
          <p v-else class="px-4 text-xs text-muted-foreground">
            {{ t(SECTION_EMPTY[section.kind]) }}
          </p>
        </section>
        <p
          v-if="!currentTrees.length"
          class="px-4 text-xs text-muted-foreground"
        >
          {{
            isSearching
              ? t('prototype.editorWorkflows.noMatches')
              : t('prototype.editorWorkflows.empty.workflows')
          }}
        </p>
        <div v-if="hiddenCount" class="flex flex-col gap-1 px-2">
          <Button
            variant="muted-textonly"
            size="sm"
            class="self-start"
            :aria-expanded="showHidden"
            :aria-controls="otherProjectsId"
            @click="showHidden = !showHidden"
          >
            <i
              aria-hidden="true"
              :class="
                cn(
                  'icon-[lucide--chevron-right] size-3.5 transition-transform',
                  showHidden && 'rotate-90'
                )
              "
            />
            {{ t('prototype.editorWorkflows.otherProjects') }}
            <Badge variant="badge" severity="secondary">
              {{ hiddenCount }}
            </Badge>
          </Button>
          <section
            v-if="showHidden"
            :id="otherProjectsId"
            :aria-label="t('prototype.editorWorkflows.otherProjects')"
          >
            <TreeExplorer
              v-model:expanded-keys="expandedKeys"
              class="px-0"
              :root="othersRoot"
              :selection-keys="selectionKeys"
            />
          </section>
        </div>
      </div>
    </template>
  </SidebarTabTemplate>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TextDivider from '@/components/common/TextDivider.vue'
import TreeExplorer from '@/components/common/TreeExplorer.vue'
import SidebarTabTemplate from '@/components/sidebar/tabs/SidebarTabTemplate.vue'
import SidebarTopArea from '@/components/sidebar/tabs/SidebarTopArea.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'
import SearchInput from '@/components/ui/search-input/SearchInput.vue'
import { useTreeExpansion } from '@/composables/useTreeExpansion'
import type { TreeExplorerNode } from '@/types/treeExplorerTypes'

import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeTabsStore } from '../../stores/tabsStore'
import type { Workflow } from '../../types'
import {
  matchingWorkflows,
  workflowCount,
  workflowsOfProject
} from '../../utils/projectWorkflows'
import type {
  ProjectWorkflows,
  WorkflowSection,
  WorkflowSectionKind
} from '../../utils/projectWorkflows'

type WorkflowNode = TreeExplorerNode<Workflow>

const SECTION_LABELS: Record<WorkflowSectionKind, string> = {
  workflows: 'prototype.editorWorkflows.sections.workflows',
  templates: 'prototype.editorWorkflows.sections.templates'
}
const SECTION_EMPTY: Record<WorkflowSectionKind, string> = {
  workflows: 'prototype.editorWorkflows.empty.workflows',
  templates: 'prototype.editorWorkflows.empty.templates'
}

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const tabsStore = usePrototypeTabsStore()

const searchQuery = ref('')
const isSearching = computed(() => searchQuery.value.trim().length > 0)
const showHidden = ref(false)
const otherProjectsId = useId()
const expandedKeys = ref<Record<string, boolean>>({})
const { expandNode, toggleNodeOnEvent } = useTreeExpansion(expandedKeys)

const groups = computed(() =>
  customCloud.switchableProjects.map((project) =>
    matchingWorkflows(
      workflowsOfProject(
        project,
        customCloud.switchableProjects,
        personaStore.fixture.workflows
      ),
      searchQuery.value
    )
  )
)

const current = computed(() =>
  groups.value.find((g) => g.project.id === customCloud.currentProject?.id)
)

const others = computed(() =>
  groups.value.filter(
    (group) => group !== current.value && workflowCount(group) > 0
  )
)
const hiddenCount = computed(() =>
  others.value.reduce((sum, group) => sum + workflowCount(group), 0)
)

function toggleFolder(this: WorkflowNode, event: MouseEvent) {
  toggleNodeOnEvent(event, this)
}

// A workflow opens in the project it's listed under: a reload into that
// project if it isn't this one, then its tab, reused if already open.
function workflowNode(projectId: string, workflow: Workflow): WorkflowNode {
  return {
    key: `workflow/${workflow.id}`,
    label: workflow.name,
    leaf: true,
    data: workflow,
    handleClick: () => customCloud.openWorkflow(projectId, workflow)
  }
}

// Templates and My Workflows keep their folders, as on their pages; your
// drafts for a project stay flat.
function sectionChildren(
  group: ProjectWorkflows,
  section: WorkflowSection
): WorkflowNode[] {
  const projectId = group.project.id
  const leaves = section.workflows.map((w) => workflowNode(projectId, w))
  if (section.kind === 'workflows' && !group.project.isDrafts) return leaves
  const folders = (personaStore.fixture.folders ?? []).filter(
    (f) => f.projectId === projectId
  )
  const folderNodes = folders
    .map((folder) => ({
      key: `${projectId}/${section.kind}/${folder.id}`,
      label: folder.name,
      leaf: false,
      children: leaves.filter((leaf) => leaf.data?.folderId === folder.id),
      handleClick: toggleFolder
    }))
    .filter((folder) => folder.children.length)
  const folderIds = new Set(folders.map((f) => f.id))
  return [
    ...folderNodes,
    ...leaves.filter((leaf) => !folderIds.has(leaf.data?.folderId ?? ''))
  ]
}

// This project's sections, each its own tree. While searching, a section
// with no matches drops out.
const currentTrees = computed(() => {
  const group = current.value
  if (!group) return []
  return group.sections
    .filter((section) => !isSearching.value || section.workflows.length)
    .map((section) => ({
      section,
      root: {
        key: `${group.project.id}/${section.kind}`,
        label: '',
        children: sectionChildren(group, section)
      }
    }))
})

// Each other project is a folder of its non-empty sections.
const othersRoot = computed<WorkflowNode>(() => ({
  key: 'others',
  label: '',
  children: others.value.map((group) => ({
    key: `project/${group.project.id}`,
    label: group.project.name,
    leaf: false,
    handleClick: toggleFolder,
    children: group.sections
      .filter((section) => section.workflows.length)
      .map((section) => ({
        key: `project/${group.project.id}/${section.kind}`,
        label: t(SECTION_LABELS[section.kind]),
        leaf: false,
        handleClick: toggleFolder,
        children: sectionChildren(group, section)
      }))
  }))
}))

const selectionKeys = computed(() => {
  const tab = tabsStore.openTabs.find((t) => t.id === tabsStore.activeTabId)
  return tab?.workflowId ? { [`workflow/${tab.workflowId}`]: true } : {}
})

// Open every folder that holds a match, here and under Other projects; close
// them all again when the search is cleared.
function expandMatches(query: string) {
  if (!query.trim()) {
    expandedKeys.value = {}
    return
  }
  for (const { root } of currentTrees.value) expandNode(root)
  expandNode(othersRoot.value)
}

// A project switch reloads the editor, so the panel starts fresh.
watch(
  () => customCloud.currentProject?.id,
  () => {
    searchQuery.value = ''
    showHidden.value = false
    expandedKeys.value = {}
  }
)
</script>
