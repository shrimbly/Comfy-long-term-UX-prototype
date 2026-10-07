<template>
  <div class="flex w-full max-w-4xl flex-col gap-10">
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
          :class="cn(inputClass, 'max-w-md')"
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
          :class="cn(inputClass, 'h-auto max-w-md resize-y py-2')"
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
          <dd class="m-0">
            <span
              class="inline-flex h-6 items-center rounded-full bg-secondary-background-hover px-2 text-xs text-base-foreground"
            >
              {{ tierLabel }}
            </span>
          </dd>
        </div>
        <div class="flex flex-col gap-0.5">
          <dt class="text-xs text-muted-foreground">
            {{ t('prototype.views.settings.general.ownerLabel') }}
          </dt>
          <dd class="m-0 text-sm text-base-foreground">{{ ownerLabel }}</dd>
        </div>
      </dl>

      <p
        v-if="!canEditIdentity"
        class="m-0 text-xs text-muted-foreground italic"
      >
        {{ t('prototype.views.settings.general.readOnly') }}
      </p>
    </SettingsPanel>
    <details
      v-if="canDeleteWorkspace"
      class="rounded-lg border border-border-subtle p-5"
    >
      <summary class="cursor-pointer text-sm text-muted-foreground">
        {{ t('prototype.views.settings.tabs.dangerZone') }}
      </summary>
      <div class="pt-6">
        <div class="flex max-w-4xl flex-col gap-8">
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
                  {{
                    t('prototype.views.settings.ownership.selectPlaceholder')
                  }}
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
              <Button variant="destructive" size="lg" @click="onDelete">
                {{ t('prototype.views.settings.danger.deleteButton') }}
              </Button>
            </div>
          </SettingsPanel>
        </div>
      </div>
    </details>
  </div>
</template>
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from '../components/settings/SettingsPanel.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkspaceRole } from '../types'

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

const otherAdmins = computed(() =>
  fixture.value.members.filter(
    (m) => m.role === 'admin' && m.id !== fixture.value.currentUser.id
  )
)
const canTransferOwnership = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)
const canDeleteWorkspace = computed(
  () => isAdmin.value && workspace.value?.tier === 'team'
)

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
