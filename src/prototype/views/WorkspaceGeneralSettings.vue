<template>
  <div class="flex w-full flex-col gap-4">
    <section :class="cardClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.views.settings.general.heading') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.views.settings.general.description') }}
        </p>
      </div>
      <dl class="m-0 flex flex-col">
        <ProjectSettingsRow
          :label="t('prototype.views.settings.general.nameLabel')"
        >
          <input
            v-if="canEditIdentity"
            :value="workspace?.name ?? ''"
            type="text"
            :aria-label="t('prototype.views.settings.general.nameLabel')"
            :class="inputClass"
            @change="onNameChange(($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ workspace?.name }}</span>
        </ProjectSettingsRow>
        <ProjectSettingsRow
          :label="t('prototype.views.settings.general.descriptionLabel')"
        >
          <textarea
            v-if="canEditIdentity"
            :value="workspace?.description ?? ''"
            :placeholder="
              t('prototype.views.settings.general.descriptionPlaceholder')
            "
            :aria-label="t('prototype.views.settings.general.descriptionLabel')"
            rows="2"
            :class="cn(inputClass, 'h-auto resize-y py-2 text-left')"
            @change="
              onDescriptionChange(($event.target as HTMLTextAreaElement).value)
            "
          />
          <span v-else class="text-right">{{ workspace?.description }}</span>
        </ProjectSettingsRow>
        <ProjectSettingsRow
          :label="t('prototype.views.settings.general.typeLabel')"
        >
          <span
            class="inline-flex h-6 items-center rounded-full bg-secondary-background-hover px-2 text-xs"
          >
            {{ tierLabel }}
          </span>
        </ProjectSettingsRow>
        <ProjectSettingsRow
          :label="t('prototype.views.settings.general.ownerLabel')"
        >
          <span>{{ ownerLabel }}</span>
        </ProjectSettingsRow>
      </dl>
      <p v-if="!canEditIdentity" class="m-0 text-xs text-muted-foreground">
        {{ t('prototype.views.settings.general.readOnly') }}
      </p>
    </section>

    <section v-if="canTransferOwnership" :class="cardClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.views.settings.ownership.heading') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.views.settings.ownership.description') }}
        </p>
      </div>
      <dl class="m-0 flex flex-col">
        <ProjectSettingsRow
          :label="t('prototype.views.settings.ownership.transfer')"
          :detail="
            otherAdmins.length
              ? t('prototype.views.settings.ownership.billingNote')
              : t('prototype.views.settings.ownership.noTargets')
          "
        >
          <span class="flex items-center gap-2">
            <select
              v-model="transferTargetId"
              :aria-label="t('prototype.views.settings.ownership.transfer')"
              :disabled="!otherAdmins.length"
              :class="inputClass"
            >
              <option value="" disabled>
                {{ t('prototype.views.settings.ownership.selectPlaceholder') }}
              </option>
              <option
                v-for="admin in otherAdmins"
                :key="admin.id"
                :value="admin.id"
              >
                {{ admin.name }}
              </option>
            </select>
            <Button
              variant="secondary"
              size="md"
              :disabled="!transferTargetId"
              @click="onTransferOwnership"
            >
              {{ t('prototype.views.settings.ownership.transfer') }}
            </Button>
          </span>
        </ProjectSettingsRow>
      </dl>
    </section>

    <section v-if="canDeleteWorkspace" :class="cardClass">
      <div>
        <h2 :class="headingClass">
          {{ t('prototype.views.settings.danger.deleteButton') }}
        </h2>
        <p :class="hintClass">
          {{ t('prototype.views.settings.danger.description') }}
        </p>
      </div>
      <div>
        <Button variant="destructive" size="md" @click="onDelete">
          {{ t('prototype.views.settings.danger.deleteButton') }}
        </Button>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ProjectSettingsRow from '../components/project/ProjectSettingsRow.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkspaceRole } from '../types'

const cardClass =
  'flex flex-col gap-4 rounded-2xl border border-border-subtle bg-secondary-background/40 p-6'
const headingClass = 'm-0 text-sm font-medium'
const hintClass = 'mt-1 mb-0 text-sm text-muted-foreground'
const inputClass =
  'h-9 w-72 rounded-lg border border-border-subtle bg-base-background px-3 text-sm text-base-foreground outline-none focus:border-base-foreground disabled:cursor-not-allowed disabled:opacity-60'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

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
