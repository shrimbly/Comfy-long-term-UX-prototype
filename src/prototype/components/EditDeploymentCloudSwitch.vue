<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/cloud-only-permissions.md — on Comfy
              Cloud a project can use what the workspace allows, nothing else
    log:      prototype/design-decisions.md — 2026-10-07 "Switching between
              Comfy Cloud and a custom deployment: a summary first"

  What moving this project to Comfy Cloud means, before it happens: the
  machine, the build, and which pinned packs or models it would lose. The
  deployment itself stays for the other projects.
-->
<template>
  <header class="flex flex-col gap-1 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{ tText('prototype.customCloud.switch.toCloudTitle', { project }) }}
    </h2>
    <p class="m-0 text-sm text-muted-foreground">
      {{ t('prototype.customCloud.switch.toCloudHint') }}
    </p>
  </header>

  <dl
    class="m-0 flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-1"
  >
    <div
      v-for="(row, i) in rows"
      :key="row.label"
      :class="
        cn(
          'flex min-h-11.5 items-center justify-between gap-3 px-3 py-2 text-sm',
          i > 0 && 'border-t border-border-subtle'
        )
      "
    >
      <dt class="text-muted-foreground">{{ row.label }}</dt>
      <dd class="m-0 flex flex-col items-end gap-0.5 text-right">
        <span>{{ row.value }}</span>
        <span
          v-if="row.lost.length"
          class="flex items-center gap-1.5 text-xs text-warning-foreground"
        >
          <i class="icon-[lucide--triangle-alert] size-3.5" />
          {{
            t('prototype.customCloud.switch.lost', {
              items: row.lost.join(', ')
            })
          }}
        </span>
      </dd>
    </div>
  </dl>

  <p class="m-0 -mt-2 text-sm text-muted-foreground">
    {{
      t(
        'prototype.customCloud.switch.deploymentStays',
        {
          name: deployment?.name ?? '',
          count: others
        },
        others
      )
    }}
  </p>

  <footer class="flex items-center gap-2.5">
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.editStep = 'config'"
    >
      <i class="icon-[lucide--arrow-left] size-4" />
      {{ t('prototype.customCloud.dialog.impact.back') }}
    </Button>
    <Button
      variant="inverted"
      size="lg"
      @click="customCloud.moveEditingProjectToCloud()"
    >
      {{ t('prototype.customCloud.switch.toCloudConfirm') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { useWorkspaceAllowlist } from '../composables/useWorkspaceAllowlist'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypePolicyStore } from '../stores/policyStore'

const { titleId } = defineProps<{
  titleId: string
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const policies = usePrototypePolicyStore()
const allowlist = useWorkspaceAllowlist()

const deployment = computed(() => customCloud.editingDeployment)
const project = computed(
  () =>
    personaStore.visibleProjects.find(
      (p) => p.id === customCloud.editingFromProjectId
    )?.name ?? ''
)
const others = computed(() => customCloud.editingProjects.length - 1)

function nameOf(id: string) {
  return policies.catalog.find((item) => item.id === id)?.name ?? id
}

// Pinned items the workspace does not allow stop working on Comfy Cloud.
function lost(ids: string[]) {
  return ids.filter((id) => !policies.isAllowed(id)).map(nameOf)
}

const rows = computed(() => {
  const groups = allowlist.value
  return [
    {
      label: t('prototype.customCloud.edit.gpu'),
      value: t('prototype.projectPage.environmentSheet.gpuShared'),
      lost: []
    },
    {
      label: t('prototype.customCloud.switch.build'),
      value: t('prototype.customCloud.switch.noBuild'),
      lost: []
    },
    ...groups.map((group) => ({
      label: group.label,
      value: group.restricted
        ? t('prototype.customCloud.switch.allowedByWorkspace', {
            count: group.allowed.length
          })
        : t('prototype.customCloud.switch.allAllowed'),
      lost: lost(
        group.id === 'nodes'
          ? (deployment.value?.nodePacks ?? [])
          : (deployment.value?.models ?? [])
      )
    }))
  ]
})
</script>
