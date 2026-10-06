<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <PageTitle>{{ t('prototype.environments.title') }}</PageTitle>
        <p class="mt-2 mb-0 text-sm text-muted-foreground">
          {{ t('prototype.environments.description') }}
        </p>
      </div>
      <Button
        v-if="store.canManage"
        variant="secondary"
        size="lg"
        @click="dialog = { kind: 'create' }"
      >
        <i class="icon-[ph--plus-bold] size-4" />{{
          t('prototype.environments.new')
        }}
      </Button>
    </header>
    <Input
      v-if="store.deployments.length"
      v-model="search"
      class="h-10 max-w-72"
      :placeholder="t('prototype.environments.search')"
      :aria-label="t('prototype.environments.search')"
    />
    <div
      v-if="filtered.length"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <button
        v-for="deployment in filtered"
        :key="deployment.id"
        type="button"
        class="flex cursor-pointer flex-col gap-5 rounded-xl border border-border-subtle bg-secondary-background/30 p-6 text-left text-base-foreground transition-colors hover:border-border-default hover:bg-secondary-background/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-base-foreground"
        :aria-label="
          textT('prototype.environments.open', { name: deployment.name })
        "
        @click="dialog = { kind: 'edit', deployment }"
      >
        <span class="flex items-center justify-between gap-3">
          <span
            class="grid size-10 place-items-center rounded-lg bg-secondary-background text-lg font-medium"
            >{{ deployment.name.charAt(0) }}</span
          >
          <span
            class="flex items-center gap-2 text-xs text-muted-foreground"
            :title="
              deployment.status === 'asleep'
                ? t('prototype.environments.sleepHint')
                : undefined
            "
          >
            <DeploymentStatusDot :status="deployment.status" />{{
              t(statusKeys[deployment.status])
            }}
          </span>
        </span>
        <span class="min-w-0">
          <span class="block truncate text-base font-semibold">{{
            deployment.name
          }}</span>
          <span class="mt-1 block text-sm text-muted-foreground"
            >{{ deployment.gpu }} ·
            {{
              t('prototype.environments.buildVersion', {
                version: deployment.release
              })
            }}</span
          >
        </span>
        <span class="flex gap-3 text-xs text-muted-foreground">
          <span>{{
            t('prototype.environments.nodes', deployment.nodePacks.length)
          }}</span>
          <span>{{
            t('prototype.environments.models', deployment.models.length)
          }}</span>
        </span>
        <span
          class="mt-1 flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-muted-foreground"
        >
          <span>{{
            t(
              'prototype.environments.projects',
              store.projects.filter(
                (project) => project.deploymentId === deployment.id
              ).length
            )
          }}</span>
          <i class="icon-[ph--arrow-right-bold] size-4" />
        </span>
      </button>
    </div>
    <div
      v-else
      class="rounded-xl border border-dashed border-border-subtle px-6 py-16 text-center"
    >
      <p class="m-0 text-sm">
        {{
          t(
            store.deployments.length
              ? 'prototype.environments.noResults'
              : 'prototype.environments.empty'
          )
        }}
      </p>
      <Button
        v-if="search"
        variant="muted-textonly"
        class="mt-3"
        @click="search = ''"
        >{{ t('prototype.environments.clear') }}</Button
      >
      <p v-else class="mt-2 mb-0 text-sm text-muted-foreground">
        {{ t('prototype.environments.emptyHint') }}
      </p>
    </div>
    <DeploymentDialog
      v-if="dialog"
      :deployment="dialog.kind === 'edit' ? dialog.deployment : undefined"
      @close="dialog = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import PageTitle from '../components/PageTitle.vue'
import DeploymentStatusDot from '../components/DeploymentStatusDot.vue'
import DeploymentDialog from '../components/DeploymentDialog.vue'
import { useTextT } from '../composables/useTextT'
import { usePrototypeEnvironmentStore } from '../stores/environmentStore'
import type { Deployment, DeploymentStatus } from '../types'

const { t } = useI18n()
const textT = useTextT()
const store = usePrototypeEnvironmentStore()
const search = ref('')
const dialog = ref<
  { kind: 'create' } | { kind: 'edit'; deployment: Deployment } | null
>(null)
const statusKeys: Record<DeploymentStatus, string> = {
  ready: 'prototype.environments.status.ready',
  asleep: 'prototype.environments.status.asleep',
  building: 'prototype.environments.status.building'
}
const filtered = computed(() =>
  store.deployments.filter((deployment) =>
    `${deployment.name} ${deployment.gpu}`
      .toLowerCase()
      .includes(search.value.trim().toLowerCase())
  )
)
</script>
