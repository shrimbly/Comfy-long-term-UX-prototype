<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workspace.md
             — Settings inventory: model + custom-node allowlists,
               data/training policy, billing, member credit limits
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             — Admin-only with delegable allowlist editing (edit-allowlists)
    log:     ../prototype/design-decisions.md (2026-05-13)
             — Workspace settings scope + Settings design system

  Tabbed surface so an Admin doesn't see one very long page. Each tab
  visibility is gated by role + delegations; missing tabs collapse the
  strip rather than rendering disabled placeholders.

  Uses the shared SettingsPanel / SettingsSubCard / SettingsTable
  components and the production Button component for a single design
  vocabulary across the page.
-->
<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="m-0 text-2xl font-semibold text-text-primary">
        {{ t('prototype.views.settings.title') }}
      </h1>
      <p class="mt-1 text-sm text-text-secondary">
        {{ t('prototype.views.settings.subtitle') }}
      </p>
    </header>

    <div
      v-if="isGuest"
      class="rounded-2xl border border-dashed border-interface-stroke p-12 text-center text-sm text-text-secondary"
    >
      {{ t('prototype.views.settings.guestEmpty') }}
    </div>

    <template v-else>
      <nav class="flex gap-1 border-b border-interface-stroke" role="tablist">
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
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )
          "
          @click="activeTab = tab.id"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.count"
            class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-text-secondary"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>

      <template v-if="activeTab === 'general'">
        <SettingsPanel
          :title="t('prototype.views.settings.general.heading')"
          :description="t('prototype.views.settings.general.description')"
        >
          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted" :for="nameInputId">
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
            <label class="text-xs text-muted" :for="descInputId">
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
                onDescriptionChange(
                  ($event.target as HTMLTextAreaElement).value
                )
              "
            />
          </div>

          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex flex-col gap-0.5">
              <dt class="text-xs text-muted">
                {{ t('prototype.views.settings.general.typeLabel') }}
              </dt>
              <dd>
                <span
                  class="inline-flex h-6 items-center rounded-full bg-secondary-background px-2 text-xs text-text-primary"
                >
                  {{ tierLabel }}
                </span>
              </dd>
            </div>
            <div class="flex flex-col gap-0.5">
              <dt class="text-xs text-muted">
                {{ t('prototype.views.settings.general.ownerLabel') }}
              </dt>
              <dd class="text-sm text-text-primary">{{ ownerLabel }}</dd>
            </div>
          </dl>

          <p v-if="!canEditIdentity" class="m-0 text-xs text-muted italic">
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
              <span class="text-text-primary">
                {{ t('prototype.views.settings.dataTraining.toggleLabel') }}
              </span>
              <span class="text-xs text-muted">
                {{ t('prototype.views.settings.dataTraining.toggleHint') }}
              </span>
            </span>
          </label>
        </SettingsPanel>
      </template>

      <template v-if="activeTab === 'allowlists'">
        <AllowlistEditor
          :title="t('prototype.views.settings.modelAllowlist.heading')"
          :description="
            t('prototype.views.settings.modelAllowlist.description')
          "
          :entries="fixture.allowlists.models.entries"
          :enabled="fixture.allowlists.models.enabled"
          :can-edit="canEditAllowlists"
          :add-placeholder="
            t('prototype.views.settings.modelAllowlist.placeholder')
          "
          :added-by-label="addedByLabel"
          @add="(name) => personaStore.addAllowlistEntry('model', name)"
          @remove="(id) => personaStore.removeAllowlistEntry('model', id)"
          @toggle-enabled="
            (enabled) => personaStore.setAllowlistEnabled('model', enabled)
          "
        />

        <AllowlistEditor
          :title="t('prototype.views.settings.partnerNodeAllowlist.heading')"
          :description="
            t('prototype.views.settings.partnerNodeAllowlist.description')
          "
          :entries="fixture.allowlists.partnerNodes.entries"
          :enabled="fixture.allowlists.partnerNodes.enabled"
          :can-edit="canEditAllowlists"
          :add-placeholder="
            t('prototype.views.settings.partnerNodeAllowlist.placeholder')
          "
          :added-by-label="addedByLabel"
          @add="(name) => personaStore.addAllowlistEntry('partner-node', name)"
          @remove="
            (id) => personaStore.removeAllowlistEntry('partner-node', id)
          "
          @toggle-enabled="
            (enabled) =>
              personaStore.setAllowlistEnabled('partner-node', enabled)
          "
        />

        <AllowlistEditor
          :title="t('prototype.views.settings.customNodeAllowlist.heading')"
          :description="
            t('prototype.views.settings.customNodeAllowlist.description')
          "
          :entries="fixture.allowlists.customNodes.entries"
          :enabled="fixture.allowlists.customNodes.enabled"
          :can-edit="canEditAllowlists"
          :add-placeholder="
            t('prototype.views.settings.customNodeAllowlist.placeholder')
          "
          :added-by-label="addedByLabel"
          @add="(name) => personaStore.addAllowlistEntry('custom-node', name)"
          @remove="(id) => personaStore.removeAllowlistEntry('custom-node', id)"
          @toggle-enabled="
            (enabled) =>
              personaStore.setAllowlistEnabled('custom-node', enabled)
          "
        />

        <p v-if="!canEditAllowlists" class="m-0 text-xs text-muted italic">
          {{ t('prototype.views.settings.allowlist.delegationHint') }}
        </p>
      </template>

      <template v-if="activeTab === 'publishing'">
        <SettingsPanel
          :title="t('prototype.views.settings.hubQueue.heading')"
          :description="t('prototype.views.settings.hubQueue.description')"
        >
          <p
            v-if="!fixture.hubSubmissions.length"
            class="m-0 text-sm text-text-secondary"
          >
            {{ t('prototype.views.settings.hubQueue.empty') }}
          </p>
          <SettingsSubCard v-else>
            <ul class="m-0 flex list-none flex-col p-0">
              <li
                v-for="(sub, index) in fixture.hubSubmissions"
                :key="sub.id"
                :class="
                  cn(
                    'flex items-center justify-between gap-3 py-2',
                    index > 0 && 'border-t border-interface-stroke'
                  )
                "
              >
                <div class="flex min-w-0 flex-col gap-0.5">
                  <span class="truncate text-sm text-text-primary">
                    {{ sub.assetName }}
                  </span>
                  <span class="text-xs text-muted">
                    {{
                      t('prototype.views.settings.hubQueue.submittedBy', {
                        user: addedByLabel(sub.submittedByUserId),
                        date: sub.submittedAt
                      })
                    }}
                  </span>
                </div>
                <div class="inline-flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    @click="personaStore.rejectHubSubmission(sub.id)"
                  >
                    {{ t('prototype.views.settings.hubQueue.reject') }}
                  </Button>
                  <Button
                    variant="inverted"
                    size="lg"
                    @click="personaStore.approveHubSubmission(sub.id)"
                  >
                    {{ t('prototype.views.settings.hubQueue.approve') }}
                  </Button>
                </div>
              </li>
            </ul>
          </SettingsSubCard>
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
            <select
              v-model="transferTargetId"
              :class="cn(inputClass, 'flex-1')"
            >
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
          <p v-if="!otherAdmins.length" class="m-0 text-xs text-muted italic">
            {{ t('prototype.views.settings.ownership.noTargets') }}
          </p>
          <p class="m-0 text-xs text-muted italic">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref, useId, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import AllowlistEditor from '../components/AllowlistEditor.vue'
import BillingSection from '../components/BillingSection.vue'
import MemberCreditLimitsSection from '../components/MemberCreditLimitsSection.vue'
import SettingsPanel from '../components/settings/SettingsPanel.vue'
import SettingsSubCard from '../components/settings/SettingsSubCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkspaceRole } from '../types'

type TabId = 'general' | 'allowlists' | 'publishing' | 'billing' | 'advanced'

const inputClass =
  'h-10 rounded-lg border border-interface-stroke bg-base-background px-3 text-sm text-text-primary outline-none focus:border-text-primary disabled:cursor-not-allowed disabled:opacity-60'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

const nameInputId = useId()
const descInputId = useId()

const viewerRole = computed<WorkspaceRole>(
  () => currentWorkspace.value?.currentUserRole ?? 'guest'
)
const isGuest = computed(() => viewerRole.value === 'guest')
const isAdmin = computed(() => viewerRole.value === 'admin')

const workspace = computed(() => currentWorkspace.value)

const canEditIdentity = computed(() => viewerRole.value === 'admin')
const canEditAllowlists = computed(
  () =>
    viewerRole.value === 'admin' ||
    (viewerRole.value === 'member' &&
      fixture.value.roleGrants['edit-allowlists'])
)
const canConfigureWorkspace = computed(
  () =>
    viewerRole.value === 'admin' ||
    (viewerRole.value === 'member' &&
      fixture.value.roleGrants['configure-workspace'])
)
const canApproveHub = computed(
  () =>
    viewerRole.value === 'admin' ||
    (viewerRole.value === 'member' &&
      fixture.value.roleGrants['approve-hub-submissions'])
)

const otherAdmins = computed(() =>
  fixture.value.members.filter(
    (m) => m.role === 'admin' && m.id !== fixture.value.currentUser.id
  )
)
const billableMemberCount = computed(
  () => fixture.value.members.filter((m) => m.role !== 'guest').length
)
const canTransferOwnership = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)
const canDeleteWorkspace = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)

const visibleTabs = computed(() => {
  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'general', label: t('prototype.views.settings.tabs.general') },
    {
      id: 'allowlists',
      label: t('prototype.views.settings.tabs.allowlists')
    }
  ]
  if (canApproveHub.value) {
    tabs.push({
      id: 'publishing',
      label: t('prototype.views.settings.tabs.publishing'),
      count: fixture.value.hubSubmissions.length || undefined
    })
  }
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

function addedByLabel(userId: string): string {
  if (userId === fixture.value.currentUser.id) {
    return t('prototype.views.members.actions.you')
  }
  return fixture.value.members.find((m) => m.id === userId)?.name ?? userId
}

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
