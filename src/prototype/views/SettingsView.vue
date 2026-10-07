<template>
  <div
    class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 pb-24 lg:px-12"
  >
    <header
      class="flex items-end justify-between gap-4 border-b border-border-subtle pb-6"
    >
      <div>
        <div class="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{
            isAccount
              ? t('prototype.settings.accountGroup')
              : currentWorkspace?.name
          }}</span>
          <i class="icon-[lucide--chevron-right] size-3" />
          <span>{{ title }}</span>
        </div>
        <h2 class="m-0 text-2xl font-semibold tracking-tight">{{ title }}</h2>
        <p class="mt-2 mb-0 text-sm text-muted-foreground">
          {{ t(`prototype.settings.pages.${ui.settingsPage}.description`) }}
        </p>
      </div>
      <Button
        v-if="ui.settingsPage === 'members'"
        variant="inverted"
        size="lg"
        @click="inviting = true"
      >
        <i class="icon-[lucide--plus] size-4" />
        {{ t('prototype.views.members.invite') }}
      </Button>
    </header>
    <div v-if="isAccount" class="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <template v-if="ui.settingsPage === 'account'">
        <section>
          <h3 class="mb-1 text-sm font-semibold">
            {{ t('prototype.settings.profile') }}
          </h3>
          <p class="mb-4 text-sm text-muted-foreground">
            {{ t('prototype.settings.profileHint') }}
          </p>
          <dl
            class="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-secondary-background/30 text-sm"
          >
            <div class="flex items-center justify-between p-4">
              <dt>{{ t('prototype.settings.avatar') }}</dt>
              <dd
                class="m-0 grid size-9 place-items-center rounded-full bg-secondary-background text-base-foreground"
              >
                {{ fixture.currentUser.name.charAt(0) }}
              </dd>
            </div>
            <div class="p-4">
              <dt>{{ t('prototype.settings.displayName') }}</dt>
              <dd class="mt-2 ml-0 text-muted-foreground">
                {{ fixture.currentUser.name }}
              </dd>
            </div>
            <div class="flex items-center justify-between p-4">
              <div>
                <dt>{{ t('prototype.settings.email') }}</dt>
                <dd class="mt-2 ml-0 text-muted-foreground">
                  {{ fixture.currentUser.email }}
                </dd>
              </div>
              <span class="flex items-center gap-2"
                ><span class="size-1.5 rounded-full bg-success-background" />{{
                  t('prototype.settings.verified')
                }}</span
              >
            </div>
          </dl>
          <p class="mt-5 text-sm text-muted-foreground">
            {{ t('prototype.settings.accountHint') }}
          </p>
        </section>
      </template>
      <template v-else>
        <section v-for="section in securitySections" :key="section.title">
          <h3 class="mb-1 text-sm font-semibold">{{ section.title }}</h3>
          <p class="mb-4 text-sm text-muted-foreground">
            {{ section.description }}
          </p>
          <div
            class="flex items-center justify-between rounded-lg border border-border-subtle bg-secondary-background/30 p-4 text-sm"
          >
            <div>
              <p class="m-0">{{ section.name }}</p>
              <p class="mt-2 mb-0 text-muted-foreground">
                {{ section.detail }}
              </p>
            </div>
            <span class="flex items-center gap-2"
              ><span class="size-1.5 rounded-full bg-success-background" />{{
                section.status
              }}</span
            >
          </div>
        </section>
      </template>
    </div>
    <WorkspaceGeneralSettings
      v-else-if="ui.settingsPage === 'general'"
      :key="currentWorkspace?.id"
    />
    <ProjectsSettings v-else-if="ui.settingsPage === 'projects'" />
    <MembersView
      v-else-if="ui.settingsPage === 'members'"
      v-model:inviting="inviting"
    />
    <WorkspaceUsage
      v-else-if="ui.settingsPage === 'usage'"
      :key="currentWorkspace?.id"
    />
    <WorkspacePolicies
      v-else-if="ui.settingsPage === 'policies'"
      :key="currentWorkspace?.id"
    />
    <BillingSection
      v-else-if="
        ui.settingsPage === 'billing' &&
        billing &&
        currentWorkspace?.currentUserRole === 'admin'
      "
      :billing
      :tier="currentWorkspace?.tier ?? 'personal'"
      :billable-member-count="fixture.members.length"
    />
    <p v-else class="text-sm text-muted-foreground">
      {{ t('prototype.settings.noBilling') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import BillingSection from '../components/BillingSection.vue'
import ProjectsSettings from '../components/settings/ProjectsSettings.vue'
import WorkspacePolicies from '../components/settings/WorkspacePolicies.vue'
import WorkspaceUsage from '../components/settings/WorkspaceUsage.vue'
import WorkspaceGeneralSettings from './WorkspaceGeneralSettings.vue'
import MembersView from './MembersView.vue'

const { t } = useI18n()
const ui = usePrototypeUiStore()
const { fixture, currentWorkspace } = storeToRefs(usePrototypePersonaStore())
const inviting = ref(false)
const isAccount = computed(() =>
  ['account', 'security'].includes(ui.settingsPage)
)
const title = computed(() =>
  t(`prototype.settings.pages.${ui.settingsPage}.title`)
)
const billing = computed(() =>
  currentWorkspace.value?.tier === 'personal' &&
  fixture.value.workspaces.length > 1
    ? null
    : fixture.value.billing
)
const securitySections = computed(() => [
  {
    title: t('prototype.settings.signIn'),
    description: t('prototype.settings.signInHint'),
    name: 'Google',
    detail: fixture.value.currentUser.email,
    status: t('prototype.settings.connected')
  },
  {
    title: t('prototype.settings.session'),
    description: t('prototype.settings.sessionHint'),
    name: t('prototype.settings.browser'),
    detail: t('prototype.settings.currentSession'),
    status: t('prototype.settings.active')
  }
])
</script>
