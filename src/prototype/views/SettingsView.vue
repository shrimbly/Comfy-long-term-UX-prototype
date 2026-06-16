<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workspace.md
             — Settings inventory: data/training policy, billing,
               member credit limits
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             — Admin-only workspace configuration
    log:     ../prototype/design-decisions.md (2026-05-13) Workspace settings
             scope; (2026-06-16) MVP — allowlists / installs / review /
             Hub-publishing tabs removed.

  Tabbed surface so an Admin doesn't see one very long page. Each tab
  visibility is gated by role; missing tabs collapse the strip rather
  than rendering disabled placeholders.
-->
<template>
  <div class="flex flex-col gap-8">
    <header>
      <PageTitle>{{ t('prototype.views.settings.title') }}</PageTitle>
    </header>

    <nav class="flex gap-1 border-b border-border-subtle" role="tablist">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="
          cn(
            'inline-flex h-10 cursor-pointer appearance-none items-center gap-2 border-0 border-b-2 bg-transparent px-3 text-sm transition-colors',
            activeTab === tab.id
              ? 'border-base-foreground text-base-foreground'
              : 'border-transparent text-muted-foreground hover:text-base-foreground'
          )
        "
        @click="activeTab = tab.id"
      >
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <template v-if="activeTab === 'general'">
      <SettingsPanel
        :title="t('prototype.views.settings.general.heading')"
        :description="t('prototype.views.settings.general.description')"
      >
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground" :for="nameInputId">
            {{ t('prototype.views.settings.general.nameLabel') }}
          </label>
          <input
            :id="nameInputId"
            :value="workspace?.name ?? ''"
            :disabled="!canEditIdentity"
            type="text"
            :class="inputClass"
            @change="onNameChange(($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground" :for="descInputId">
            {{ t('prototype.views.settings.general.descriptionLabel') }}
          </label>
          <textarea
            :id="descInputId"
            :value="workspace?.description ?? ''"
            :disabled="!canEditIdentity"
            :placeholder="
              t('prototype.views.settings.general.descriptionPlaceholder')
            "
            rows="2"
            :class="cn(inputClass, 'h-auto resize-y py-2')"
            @change="
              onDescriptionChange(($event.target as HTMLTextAreaElement).value)
            "
          />
        </div>

        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div class="flex flex-col gap-0.5">
            <dt class="text-xs text-muted-foreground">
              {{ t('prototype.views.settings.general.typeLabel') }}
            </dt>
            <dd>
              <span
                class="inline-flex h-6 items-center rounded-full bg-secondary-background px-2 text-xs text-base-foreground"
              >
                {{ tierLabel }}
              </span>
            </dd>
          </div>
          <div class="flex flex-col gap-0.5">
            <dt class="text-xs text-muted-foreground">
              {{ t('prototype.views.settings.general.ownerLabel') }}
            </dt>
            <dd class="text-sm text-base-foreground">{{ ownerLabel }}</dd>
          </div>
        </dl>

        <p
          v-if="!canEditIdentity"
          class="m-0 text-xs text-muted-foreground italic"
        >
          {{ t('prototype.views.settings.general.readOnly') }}
        </p>
      </SettingsPanel>

      <SettingsPanel
        v-if="isAdmin || canConfigureWorkspace"
        :title="t('prototype.views.settings.dataTraining.heading')"
        :description="t('prototype.views.settings.dataTraining.description')"
      >
        <label class="flex items-start gap-3">
          <input
            :checked="!!workspace?.dataTrainingOptOut"
            type="checkbox"
            class="mt-0.5 size-4 cursor-pointer appearance-auto accent-base-foreground"
            @change="
              personaStore.setDataTrainingOptOut(
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          <span class="flex flex-col gap-0.5 text-sm">
            <span class="text-base-foreground">
              {{ t('prototype.views.settings.dataTraining.toggleLabel') }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ t('prototype.views.settings.dataTraining.toggleHint') }}
            </span>
          </span>
        </label>
      </SettingsPanel>
    </template>

    <template v-if="activeTab === 'billing' && fixture.billing">
      <BillingSection
        :billing="fixture.billing"
        :tier="workspace?.tier ?? 'team'"
        :billable-member-count="billableMemberCount"
      />

      <MemberCreditLimitsSection
        v-if="workspace?.tier === 'team'"
        :members="fixture.members"
        :limits="fixture.memberCreditLimits"
        @set="
          (memberId, limit, period) =>
            personaStore.setMemberCreditLimit(memberId, limit, period)
        "
        @remove="(memberId) => personaStore.removeMemberCreditLimit(memberId)"
      />
    </template>

    <template v-if="activeTab === 'advanced'">
      <SettingsPanel
        v-if="canTransferOwnership"
        :title="t('prototype.views.settings.ownership.heading')"
        :description="t('prototype.views.settings.ownership.description')"
      >
        <div class="flex items-center gap-2">
          <select v-model="transferTargetId" :class="cn(inputClass, 'flex-1')">
            <option value="" disabled>
              {{ t('prototype.views.settings.ownership.selectPlaceholder') }}
            </option>
            <option
              v-for="admin in otherAdmins"
              :key="admin.id"
              :value="admin.id"
            >
              {{ admin.name }} ({{ admin.email }})
            </option>
          </select>
          <Button
            variant="inverted"
            size="lg"
            :disabled="!transferTargetId"
            @click="onTransferOwnership"
          >
            {{ t('prototype.views.settings.ownership.transfer') }}
          </Button>
        </div>
        <p
          v-if="!otherAdmins.length"
          class="m-0 text-xs text-muted-foreground italic"
        >
          {{ t('prototype.views.settings.ownership.noTargets') }}
        </p>
        <p class="m-0 text-xs text-muted-foreground italic">
          {{ t('prototype.views.settings.ownership.billingNote') }}
        </p>
      </SettingsPanel>

      <SettingsPanel
        v-if="canDeleteWorkspace"
        :title="t('prototype.views.settings.danger.heading')"
        :description="t('prototype.views.settings.danger.description')"
      >
        <div>
          <Button
            variant="destructive-textonly"
            size="lg"
            class="border border-destructive-background/40"
            @click="onDelete"
          >
            {{ t('prototype.views.settings.danger.deleteButton') }}
          </Button>
        </div>
      </SettingsPanel>
    </template>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref, useId, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import PageTitle from '../components/PageTitle.vue'

import Button from '@/components/ui/button/Button.vue'

import BillingSection from '../components/BillingSection.vue'
import MemberCreditLimitsSection from '../components/MemberCreditLimitsSection.vue'
import SettingsPanel from '../components/settings/SettingsPanel.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkspaceRole } from '../types'

type TabId = 'general' | 'billing' | 'advanced'

const inputClass =
  'h-10 rounded-lg border border-border-subtle bg-base-background px-3 text-sm text-base-foreground outline-none focus:border-base-foreground disabled:cursor-not-allowed disabled:opacity-60'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

const nameInputId = useId()
const descInputId = useId()

const viewerRole = computed<WorkspaceRole>(
  () => currentWorkspace.value?.currentUserRole ?? 'member'
)
const isAdmin = computed(() => viewerRole.value === 'admin')

const workspace = computed(() => currentWorkspace.value)

const canEditIdentity = computed(() => viewerRole.value === 'admin')
const canConfigureWorkspace = computed(
  () =>
    viewerRole.value === 'admin' ||
    (viewerRole.value === 'member' &&
      fixture.value.roleGrants['configure-workspace'])
)

const otherAdmins = computed(() =>
  fixture.value.members.filter(
    (m) => m.role === 'admin' && m.id !== fixture.value.currentUser.id
  )
)
const billableMemberCount = computed(() => fixture.value.members.length)
const canTransferOwnership = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)
const canDeleteWorkspace = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)

const visibleTabs = computed(() => {
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'general', label: t('prototype.views.settings.tabs.general') }
  ]
  if (isAdmin.value && fixture.value.billing) {
    tabs.push({
      id: 'billing',
      label: t('prototype.views.settings.tabs.billing')
    })
  }
  if (canTransferOwnership.value || canDeleteWorkspace.value) {
    tabs.push({
      id: 'advanced',
      label: t('prototype.views.settings.tabs.advanced')
    })
  }
  return tabs
})

const activeTab = ref<TabId>('general')

watchEffect(() => {
  if (!visibleTabs.value.some((tab) => tab.id === activeTab.value)) {
    activeTab.value = visibleTabs.value[0]?.id ?? 'general'
  }
})

const transferTargetId = ref('')

const tierLabel = computed(() =>
  workspace.value?.tier === 'personal'
    ? t('prototype.views.settings.general.tierPersonal')
    : t('prototype.views.settings.general.tierTeam')
)

const ownerLabel = computed(() => {
  const ws = workspace.value
  if (!ws) return ''
  if (ws.ownerUserId === fixture.value.currentUser.id) {
    return t('prototype.views.members.actions.you')
  }
  return (
    fixture.value.members.find((m) => m.id === ws.ownerUserId)?.name ??
    ws.ownerUserId
  )
})

function onNameChange(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return
  personaStore.setWorkspaceName(trimmed)
}

function onDescriptionChange(value: string) {
  personaStore.setWorkspaceDescription(value)
}

function onTransferOwnership() {
  const target = transferTargetId.value
  if (!target) return
  const targetMember = fixture.value.members.find((m) => m.id === target)
  if (
    !targetMember ||
    !window.confirm(
      t('prototype.views.settings.ownership.confirm', {
        name: targetMember.name
      })
    )
  ) {
    return
  }
  personaStore.transferOwnership(target)
  transferTargetId.value = ''
}

function onDelete() {
  const name = workspace.value?.name ?? ''
  if (!window.confirm(t('prototype.views.settings.danger.confirm', { name }))) {
    return
  }
  personaStore.deleteCurrentWorkspace()
}
</script>
