<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — what a
              deployment contains and whether it is up
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    log:      ../prototype/design-decisions.md (2026-10-07 — environment
              sheet; projects inherit workspace policies and only narrow)

  Right-hand sheet for a project's environment. Contents lists the custom
  nodes and models a custom build pins. Comfy Cloud supports far more than
  fits a list, so it links to what is supported and says whether the
  workspace policies narrow it. Status shows whether it is up, the build, the
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
              v-if="
                environments.canManage &&
                (deployment.kind === 'custom' || projectId)
              "
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
            <template v-if="deployment.kind === 'comfy-cloud'">
              <section
                class="flex flex-col gap-4 rounded-xl bg-secondary-background/40 p-4"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div
                    v-for="stat in cloudStats"
                    :key="stat.label"
                    class="flex items-center gap-3"
                  >
                    <i
                      :class="
                        cn(stat.icon, 'size-5 shrink-0 text-muted-foreground')
                      "
                    />
                    <span class="flex flex-col leading-tight">
                      <span class="text-lg font-semibold">{{
                        stat.value
                      }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ stat.label }}
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  as="a"
                  href="https://docs.comfy.org/cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="link"
                  size="sm"
                  class="h-auto self-start p-0 no-underline"
                >
                  {{
                    t('prototype.projectPage.environmentSheet.cloudSupported')
                  }}
                  <i class="icon-[lucide--arrow-up-right] size-3.5" />
                </Button>
              </section>

              <section class="flex flex-col gap-4">
                <h3 class="m-0 text-sm font-medium">
                  {{
                    t('prototype.projectPage.environmentSheet.allowedTitle', {
                      workspace: workspaceName
                    })
                  }}
                </h3>
                <div
                  v-for="group in restrictions"
                  :key="group.id"
                  class="flex flex-col gap-2"
                >
                  <div
                    class="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span>{{ group.label }}</span>
                    <span class="text-xs text-muted-foreground tabular-nums">
                      {{
                        group.restricted
                          ? t(
                              'prototype.projectPage.environmentSheet.allowedOf',
                              {
                                count: group.allowed.length,
                                total: group.total
                              }
                            )
                          : t(
                              'prototype.projectPage.environmentSheet.allowedAll'
                            )
                      }}
                    </span>
                  </div>
                  <ul
                    v-if="group.restricted"
                    class="m-0 flex list-none flex-wrap gap-1.5 p-0"
                  >
                    <li
                      v-for="name in group.allowed.slice(0, PREVIEW_ROWS)"
                      :key="name"
                      class="rounded-md border border-border-subtle px-2 py-0.5 text-xs"
                    >
                      {{ name }}
                    </li>
                    <li
                      v-if="group.allowed.length > PREVIEW_ROWS"
                      class="px-1 py-0.5 text-xs text-muted-foreground"
                    >
                      {{
                        t('prototype.projectPage.environmentSheet.more', {
                          count: group.allowed.length - PREVIEW_ROWS
                        })
                      }}
                    </li>
                  </ul>
                </div>
              </section>
            </template>

            <template v-else>
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
            </template>

            <Button
              variant="link"
              size="sm"
              class="h-auto self-start p-0"
              @click="openPolicies"
            >
              {{
                t(
                  deployment.kind === 'comfy-cloud'
                    ? 'prototype.projectPage.environmentSheet.seeAllPolicies'
                    : 'prototype.projectPage.settings.workspacePolicies'
                )
              }}
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
import { cn } from '@comfyorg/tailwind-utils'
import { onKeyStroke } from '@vueuse/core'
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'

import { useWorkspaceAllowlist } from '../../composables/useWorkspaceAllowlist'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypeEnvironmentStore } from '../../stores/environmentStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
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
const environments = usePrototypeEnvironmentStore()
const customCloud = usePrototypeCustomCloudStore()
const titleId = useId()

const tab = ref('contents')

const subtitle = computed(() =>
  [deployment.release, deployment.gpu].filter(Boolean).join(' · ')
)

const workspaceName = computed(() => personaStore.currentWorkspace?.name ?? '')

const PREVIEW_ROWS = 5

const cloudStats = [
  {
    icon: 'icon-[lucide--blocks]',
    value: t('prototype.projectPage.environmentSheet.cloudNodesValue'),
    label: t('prototype.projectPage.environmentSheet.cloudNodesLabel')
  },
  {
    icon: 'icon-[lucide--box]',
    value: t('prototype.projectPage.environmentSheet.cloudModelsValue'),
    label: t('prototype.projectPage.environmentSheet.cloudModelsLabel')
  }
]

const restrictions = useWorkspaceAllowlist()

// A custom build pins its packs and models.
const contents = computed(() => [
  {
    id: 'nodes',
    label: t('prototype.projectPage.environmentSheet.customNodes'),
    items: deployment.nodePacks,
    count: deployment.nodePacks.length
  },
  {
    id: 'models',
    label: t('prototype.projectPage.environmentSheet.models'),
    items: deployment.models,
    count: deployment.models.length
  }
])

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

function onEdit() {
  emit('close')
  if (deployment.kind === 'comfy-cloud') {
    if (projectId) customCloud.openEditCloud(projectId)
    return
  }
  customCloud.openEditDeployment(deployment.id, projectId)
}

function openEnvironments() {
  emit('close')
  ui.go({ kind: 'environments' })
}

onKeyStroke('Escape', () => emit('close'))
</script>
