<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — what a
              deployment contains and whether it is up
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    log:      ../prototype/design-decisions.md (2026-10-07 — environment
              sheet; projects inherit workspace policies and only narrow)

  Right-hand sheet for a project's environment. Contents lists the custom
  nodes and models the build pins, or, on Comfy Cloud, everything the
  workspace policies allow. Status shows whether it is up, the build, the
  GPU, how long it stays warm, and which projects use it.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex justify-end bg-black/30"
      @click.self="emit('close')"
    >
      <aside
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border-l border-border-subtle bg-base-background p-6 text-base-foreground"
      >
        <header class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 flex-col gap-1">
            <h2 :id="titleId" class="m-0 truncate text-xl font-semibold">
              {{ deployment.name }}
            </h2>
            <p class="m-0 text-sm text-muted-foreground">
              {{ subtitle }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <Button
              v-if="environments.canManage && deployment.kind === 'custom'"
              variant="secondary"
              size="sm"
              @click="onEdit"
            >
              {{ t('prototype.projectPage.environmentSheet.edit') }}
            </Button>
            <Button
              variant="muted-textonly"
              size="icon"
              :aria-label="t('prototype.settings.projects.close')"
              @click="emit('close')"
            >
              <i class="icon-[lucide--x] size-4" />
            </Button>
          </div>
        </header>

        <Tabs v-model="tab" class="gap-5">
          <TabsList
            variant="bordered"
            class="justify-start border-b border-border-subtle"
          >
            <TabsTrigger variant="flush" :class="triggerClass" value="contents">
              {{ t('prototype.projectPage.environmentSheet.contents') }}
            </TabsTrigger>
            <TabsTrigger variant="flush" :class="triggerClass" value="status">
              {{ t('prototype.projectPage.environmentSheet.status') }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contents" class="flex flex-col gap-6">
            <p class="m-0 text-sm text-muted-foreground">
              {{ t('prototype.projectPage.environmentSheet.inherit') }}
            </p>

            <section
              v-for="group in contents"
              :key="group.id"
              class="flex flex-col gap-2"
            >
              <h3 class="m-0 flex items-center gap-2 text-sm font-medium">
                {{ group.label }}
                <span
                  class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-muted-foreground tabular-nums"
                >
                  {{ group.count }}
                </span>
              </h3>
              <ul
                v-if="group.items.length"
                class="m-0 flex list-none flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle p-0 text-sm"
              >
                <li
                  v-for="item in group.items"
                  :key="item"
                  class="px-3 py-2 font-mono text-xs"
                >
                  {{ item }}
                </li>
              </ul>
              <p v-else class="m-0 text-sm text-muted-foreground">
                {{ t('prototype.projectPage.environmentSheet.none') }}
              </p>
            </section>

            <Button
              variant="link"
              size="sm"
              class="h-auto self-start p-0"
              @click="openPolicies"
            >
              {{ t('prototype.projectPage.settings.workspacePolicies') }}
              <i class="icon-[lucide--arrow-right] size-3.5" />
            </Button>
          </TabsContent>

          <TabsContent value="status">
            <dl class="m-0 flex flex-col divide-y divide-border-subtle">
              <ProjectSettingsRow
                :label="t('prototype.projectPage.environmentSheet.statusLabel')"
              >
                <span class="inline-flex items-center gap-2">
                  <DeploymentStatusDot :status="deployment.status" />
                  {{ t(`prototype.environments.status.${deployment.status}`) }}
                </span>
              </ProjectSettingsRow>
              <ProjectSettingsRow
                v-if="deployment.release"
                :label="t('prototype.projectPage.environmentSheet.build')"
              >
                <span>{{ deployment.release }}</span>
              </ProjectSettingsRow>
              <ProjectSettingsRow
                :label="t('prototype.projectPage.environmentSheet.gpu')"
              >
                <span>{{
                  deployment.gpu ??
                  t('prototype.projectPage.environmentSheet.gpuShared')
                }}</span>
              </ProjectSettingsRow>
              <ProjectSettingsRow
                v-if="deployment.warmMinutes"
                :label="t('prototype.projectPage.environmentSheet.keepWarm')"
              >
                <span>{{
                  t('prototype.projectPage.environmentSheet.warmValue', {
                    minutes: deployment.warmMinutes
                  })
                }}</span>
              </ProjectSettingsRow>
              <ProjectSettingsRow
                :label="t('prototype.projectPage.environmentSheet.usedBy')"
              >
                <span class="flex flex-col items-end">
                  <span v-for="name in usedBy" :key="name">{{ name }}</span>
                </span>
              </ProjectSettingsRow>
            </dl>
            <p
              v-if="deployment.kind === 'comfy-cloud'"
              class="mt-4 mb-0 text-sm text-muted-foreground"
            >
              {{ t('prototype.projectPage.environmentSheet.alwaysOn') }}
            </p>
            <Button
              v-else
              variant="link"
              size="sm"
              class="mt-4 h-auto p-0"
              @click="openEnvironments"
            >
              {{ t('prototype.projectPage.environmentSheet.manage') }}
              <i class="icon-[lucide--arrow-right] size-3.5" />
            </Button>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'

import { policyCatalog } from '../../fixtures/policyCatalog'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypeEnvironmentStore } from '../../stores/environmentStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypePolicyStore } from '../../stores/policyStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import type { Deployment } from '../../types'
import DeploymentStatusDot from '../DeploymentStatusDot.vue'
import ProjectSettingsRow from './ProjectSettingsRow.vue'

const { deployment, projectId } = defineProps<{
  deployment: Deployment
  projectId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const triggerClass =
  'rounded-none border-x-0 border-t-0 border-b-2 border-solid border-transparent focus-visible:border-base-foreground focus-visible:ring-0 data-[state=active]:border-base-foreground'

const { t } = useI18n()
const ui = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const policies = usePrototypePolicyStore()
const environments = usePrototypeEnvironmentStore()
const customCloud = usePrototypeCustomCloudStore()
const titleId = useId()

const tab = ref('contents')

const subtitle = computed(() =>
  [deployment.release, deployment.gpu].filter(Boolean).join(' · ')
)

function allowedNames(kind: 'nodes' | 'models') {
  return policyCatalog
    .filter((item) => item.kind === kind && policies.isAllowed(item.id))
    .map((item) => item.name)
}

// A custom build pins its packs and models. Comfy Cloud runs whatever the
// workspace policies allow.
const contents = computed(() => {
  const pinned = deployment.kind === 'custom'
  const nodes = pinned ? deployment.nodePacks : allowedNames('nodes')
  const models = pinned ? deployment.models : allowedNames('models')
  return [
    {
      id: 'nodes',
      label: t('prototype.projectPage.environmentSheet.customNodes'),
      items: nodes,
      count: nodes.length
    },
    {
      id: 'models',
      label: t('prototype.projectPage.environmentSheet.models'),
      items: models,
      count: models.length
    }
  ]
})

const usedBy = computed(() =>
  personaStore.visibleProjects
    .filter((project) =>
      deployment.kind === 'custom'
        ? project.deploymentId === deployment.id
        : !project.deploymentId
    )
    .map((project) => project.name)
)

function openPolicies() {
  emit('close')
  ui.openSettings('policies')
}

// The build steps are the dialog the editor uses for a new deployment.
function onEdit() {
  emit('close')
  customCloud.openEditDeployment(deployment.id, projectId)
}

function openEnvironments() {
  emit('close')
  ui.go({ kind: 'environments' })
}

onKeyStroke('Escape', () => emit('close'))
</script>
