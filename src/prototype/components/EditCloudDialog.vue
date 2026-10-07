<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — Comfy Cloud is
              the shared default; the workspace policies are its only knobs
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment on
              Comfy Cloud: the same modal, read-only, with the ways out"

  Edit deployment for a project on Comfy Cloud. Nothing here rebuilds: the
  version is managed, the machine is picked per run, and what the project
  can use comes from the workspace policies. The ways out are editing those
  policies or moving the project to a custom deployment.
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

        <header class="flex flex-col gap-1 pr-8">
          <h2 :id="titleId" class="m-0 text-2xl font-semibold">
            {{ t('prototype.customCloud.edit.title') }}
          </h2>
          <p class="m-0 flex items-center gap-2 text-sm text-muted-foreground">
            <i class="icon-[lucide--cloud] size-4" />
            {{ COMFY_CLOUD.name }}
            <span>·</span>
            {{ t('prototype.customCloud.edit.usedBy', cloudProjects.length) }}
          </p>
        </header>

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

        <p class="m-0 -mt-2 text-sm text-muted-foreground">
          {{ t('prototype.customCloud.editCloud.managed') }}
        </p>

        <footer class="flex flex-wrap items-center gap-2.5">
          <Button
            variant="muted-textonly"
            size="lg"
            class="mr-auto"
            @click="customCloud.closeEditCloud()"
          >
            {{ t('prototype.customCloud.edit.cancel') }}
          </Button>
          <Button variant="outline" size="lg" @click="openPolicies">
            {{ t('prototype.customCloud.editCloud.policies') }}
          </Button>
          <Button
            v-if="project"
            variant="inverted"
            size="lg"
            @click="isPickerOpen = true"
          >
            {{ t('prototype.customCloud.editCloud.change') }}
          </Button>
        </footer>
      </div>
    </div>
    <ProjectEnvironmentPicker
      v-if="isPickerOpen && project"
      :project
      @close="onPickerClose"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useWorkspaceAllowlist } from '../composables/useWorkspaceAllowlist'
import { COMFY_CLOUD } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

import ProjectEnvironmentPicker from './project/ProjectEnvironmentPicker.vue'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const ui = usePrototypeUiStore()
const allowlist = useWorkspaceAllowlist()
const titleId = useId()
const panel = useTemplateRef('panel')

const isPickerOpen = ref(false)

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

function openPolicies() {
  customCloud.closeEditCloud()
  ui.openSettings('policies')
}

function onPickerClose() {
  isPickerOpen.value = false
  customCloud.closeEditCloud()
}

onMounted(() => panel.value?.focus())
</script>
