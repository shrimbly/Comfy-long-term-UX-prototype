<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — Comfy Cloud is
              the shared default; the workspace policies are its only knobs
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment on
              Comfy Cloud: the same modal, read-only, with the ways out" and
              "Switching between Comfy Cloud and a custom deployment: a
              summary first"

  Edit deployment for a project on Comfy Cloud. Nothing here rebuilds: the
  version is managed, the machine is picked per run, and what the project
  can use comes from the workspace policies. The way out is a custom
  deployment: pick one (or create one), read what moving means, confirm.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="customCloud.closeEditCloud()"
      @keydown.escape="customCloud.closeEditCloud()"
    >
      <div
        ref="panel"
        tabindex="-1"
        class="relative my-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border border-border-default bg-base-background p-9 text-base-foreground shadow-2xl outline-none"
      >
        <Button
          variant="muted-textonly"
          size="icon"
          class="absolute top-3 right-3 z-10"
          :aria-label="t('prototype.customCloud.dialog.close')"
          @click="customCloud.closeEditCloud()"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>

        <template v-if="view === 'overview'">
          <header class="flex flex-col gap-1 pr-8">
            <h2 :id="titleId" class="m-0 text-2xl font-semibold">
              {{ t('prototype.customCloud.edit.title') }}
            </h2>
            <p
              class="m-0 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <i class="icon-[lucide--cloud] size-4" />
              {{ COMFY_CLOUD.name }}
              <span>·</span>
              {{ t('prototype.customCloud.edit.usedBy', cloudProjects.length) }}
            </p>
          </header>

          <div class="flex flex-col gap-2">
            <div
              class="flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-1"
            >
              <div
                v-for="(row, i) in rows"
                :key="row.label"
                :class="
                  cn(
                    'flex h-11.5 items-center justify-between gap-3 px-3 text-sm',
                    i > 0 && 'border-t border-border-subtle'
                  )
                "
              >
                <span class="text-muted-foreground">{{ row.label }}</span>
                <span class="flex items-center gap-2">
                  {{ row.value }}
                  <span v-if="row.detail" class="text-xs text-muted-foreground">
                    {{ row.detail }}
                  </span>
                </span>
              </div>
            </div>
            <Button
              variant="link"
              size="sm"
              class="h-auto self-start p-0"
              @click="openPolicies"
            >
              {{ t('prototype.customCloud.editCloud.policies') }}
              <i class="icon-[lucide--arrow-right] size-3.5" />
            </Button>
          </div>

          <EnvironmentSwitchCard
            v-if="project"
            icon="icon-[lucide--server]"
            :title="t('prototype.customCloud.switch.customTitle')"
            :body="t('prototype.customCloud.switch.customBody')"
            :action="t('prototype.customCloud.switch.customAction')"
            @switch="view = 'choose'"
          />

          <footer class="flex items-center">
            <Button
              variant="muted-textonly"
              size="lg"
              @click="customCloud.closeEditCloud()"
            >
              {{ t('prototype.customCloud.edit.cancel') }}
            </Button>
          </footer>
        </template>

        <template v-else-if="view === 'choose'">
          <header class="flex flex-col gap-1 pr-8">
            <h2 :id="titleId" class="m-0 text-2xl font-semibold">
              {{ t('prototype.customCloud.switch.chooseTitle') }}
            </h2>
            <p class="m-0 text-sm text-muted-foreground">
              {{ t('prototype.customCloud.switch.chooseHint') }}
            </p>
          </header>

          <div class="flex flex-col gap-1.5">
            <button
              v-for="option in environments.deployments"
              :key="option.id"
              type="button"
              class="flex w-full cursor-pointer appearance-none items-center gap-3 rounded-xl border border-border-subtle bg-transparent px-4 py-3 text-left text-base-foreground transition-colors hover:bg-secondary-background/50 active:scale-[0.99]"
              @click="pick(option)"
            >
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <ProjectEnvironmentChip :deployment="option" class="text-sm" />
                <span class="text-xs text-muted-foreground">
                  {{ optionDetail(option) }}
                </span>
              </span>
              <i class="icon-[lucide--chevron-right] size-4 shrink-0" />
            </button>
            <Button
              v-if="environments.canManage"
              variant="muted-textonly"
              size="md"
              class="self-start"
              @click="openCreate"
            >
              <i class="icon-[lucide--plus] size-4" />
              {{ t('prototype.environments.new') }}
            </Button>
          </div>

          <footer class="flex items-center">
            <Button
              variant="muted-textonly"
              size="lg"
              @click="view = 'overview'"
            >
              <i class="icon-[lucide--arrow-left] size-4" />
              {{ t('prototype.customCloud.dialog.impact.back') }}
            </Button>
          </footer>
        </template>

        <template v-else-if="selected">
          <header class="flex flex-col gap-1 pr-8">
            <h2 :id="titleId" class="m-0 text-2xl font-semibold">
              {{
                tText('prototype.customCloud.switch.toCustomTitle', {
                  project: project?.name ?? '',
                  name: selected.name
                })
              }}
            </h2>
            <p class="m-0 text-sm text-muted-foreground">
              {{ t('prototype.customCloud.switch.toCustomHint') }}
            </p>
          </header>

          <dl
            class="m-0 flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-1"
          >
            <div
              v-for="(row, i) in confirmRows"
              :key="row.label"
              :class="
                cn(
                  'flex h-11.5 items-center justify-between gap-3 px-3 text-sm',
                  i > 0 && 'border-t border-border-subtle'
                )
              "
            >
              <dt class="text-muted-foreground">{{ row.label }}</dt>
              <dd class="m-0">{{ row.value }}</dd>
            </div>
          </dl>

          <footer class="flex items-center gap-2.5">
            <Button
              variant="muted-textonly"
              size="lg"
              class="mr-auto"
              @click="view = 'choose'"
            >
              <i class="icon-[lucide--arrow-left] size-4" />
              {{ t('prototype.customCloud.dialog.impact.back') }}
            </Button>
            <Button variant="inverted" size="lg" @click="confirm">
              {{
                tText('prototype.customCloud.switch.toCustomConfirm', {
                  name: selected.name
                })
              }}
            </Button>
          </footer>
        </template>
      </div>
    </div>
    <DeploymentDialog v-if="isCreating" @close="onCreated" />
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { useWorkspaceAllowlist } from '../composables/useWorkspaceAllowlist'
import { COMFY_CLOUD } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeEnvironmentStore } from '../stores/environmentStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Deployment } from '../types'

import DeploymentDialog from './DeploymentDialog.vue'
import EnvironmentSwitchCard from './EnvironmentSwitchCard.vue'
import ProjectEnvironmentChip from './project/ProjectEnvironmentChip.vue'

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const environments = usePrototypeEnvironmentStore()
const ui = usePrototypeUiStore()
const allowlist = useWorkspaceAllowlist()
const titleId = useId()
const panel = useTemplateRef('panel')

const view = ref<'overview' | 'choose' | 'confirm'>('overview')
const selected = ref<Deployment | null>(null)
const isCreating = ref(false)
let countBeforeCreate = 0

const project = computed(() =>
  personaStore.visibleProjects.find(
    (p) => p.id === customCloud.editCloudProjectId
  )
)
const cloudProjects = computed(() =>
  personaStore.visibleProjects.filter((p) => !p.deploymentId)
)

const rows = computed(() => [
  {
    label: t('prototype.customCloud.edit.comfyui'),
    value: t('prototype.customCloud.editCloud.latest'),
    detail: t('prototype.customCloud.editCloud.managedByComfy')
  },
  ...allowlist.value.map((group) => ({
    label: group.label,
    value: group.restricted
      ? t('prototype.projectPage.environmentSheet.allowedOf', {
          count: group.allowed.length,
          total: group.total
        })
      : t('prototype.projectPage.environmentSheet.allowedAll'),
    detail: t('prototype.customCloud.editCloud.fromPolicies')
  })),
  {
    label: t('prototype.customCloud.edit.gpu'),
    value: t('prototype.projectPage.environmentSheet.gpuShared'),
    detail: undefined
  }
])

function projectsOn(deployment: Deployment) {
  return personaStore.visibleProjects.filter(
    (p) => p.deploymentId === deployment.id
  ).length
}

function optionDetail(deployment: Deployment) {
  const gpu =
    deployment.gpu ?? t('prototype.projectPage.environmentSheet.gpuShared')
  return `${gpu} · ${t('prototype.environments.projects', projectsOn(deployment))}`
}

const confirmRows = computed(() => {
  const d = selected.value
  if (!d) return []
  return [
    {
      label: t('prototype.customCloud.edit.gpu'),
      value: d.gpu ?? t('prototype.projectPage.environmentSheet.gpuShared')
    },
    {
      label: t('prototype.customCloud.edit.customNodes'),
      value: t('prototype.customCloud.edit.packsCount', d.nodePacks.length)
    },
    {
      label: t('prototype.customCloud.edit.models'),
      value: t('prototype.customCloud.edit.modelsCount', d.models.length)
    },
    {
      label: t('prototype.customCloud.switch.firstRun'),
      value: t(`prototype.customCloud.switch.firstRunBy.${d.status}`)
    }
  ]
})

function pick(deployment: Deployment) {
  selected.value = deployment
  view.value = 'confirm'
}

// The create dialog appends to the store, so a longer list means a new
// deployment to confirm.
function openCreate() {
  countBeforeCreate = environments.deployments.length
  isCreating.value = true
}

function onCreated() {
  isCreating.value = false
  const newest = environments.deployments.at(-1)
  if (newest && environments.deployments.length > countBeforeCreate) {
    pick(newest)
  }
}

function confirm() {
  if (!project.value || !selected.value) return
  customCloud.moveProjectTo(project.value.id, selected.value.id)
}

function openPolicies() {
  customCloud.closeEditCloud()
  ui.openSettings('policies')
}

onMounted(() => panel.value?.focus())
</script>
