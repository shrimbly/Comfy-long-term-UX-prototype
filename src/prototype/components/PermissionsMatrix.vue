<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — delegation layer
    open-q:  ../IA_Plan/wiki/open-questions.md#delegation-surface-in-ui
             — first-class permission-controls UI
    open-q:  ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
             — admin-controlled per-role grants
    decision: prototype/design-decisions.md (2026-05-13)
             — per-role baseline; Admin always on, Guest always off

  Per-role baseline grants. Admin column is always-on, Guest always-off;
  Member is the only interactive column. Read-only when current user is
  not an Admin.
-->
<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-muted-foreground">
      {{ t('prototype.views.members.permissionsTab.intro') }}
    </p>
    <p v-if="readOnly" class="text-xs text-muted-foreground italic">
      {{ t('prototype.views.members.permissionsTab.readOnlyNote') }}
    </p>
    <div
      class="overflow-hidden rounded-xl border border-border-subtle bg-base-background"
    >
      <table class="w-full border-collapse text-sm">
        <thead class="bg-secondary-background text-left">
          <tr>
            <th class="px-4 py-3 font-medium">
              {{ t('prototype.views.members.permissionsTab.headerCapability') }}
            </th>
            <th class="w-24 px-4 py-3 text-center font-medium">
              {{ t('prototype.views.members.permissionsTab.roleAdmin') }}
            </th>
            <th class="w-24 px-4 py-3 text-center font-medium">
              {{ t('prototype.views.members.permissionsTab.roleMember') }}
            </th>
            <th class="w-24 px-4 py-3 text-center font-medium">
              {{ t('prototype.views.members.permissionsTab.roleGuest') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cap in capabilities"
            :key="cap"
            class="border-t border-border-subtle"
          >
            <td class="px-4 py-3">
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">
                  {{
                    t(
                      `prototype.views.members.permissionsTab.capability.${capabilityI18nKey(cap)}.label`
                    )
                  }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{
                    t(
                      `prototype.views.members.permissionsTab.capability.${capabilityI18nKey(cap)}.description`
                    )
                  }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-center align-middle">
              <span
                class="icon-[lucide--check] size-4 text-muted-foreground"
                :title="t('prototype.views.members.permissionsTab.always')"
              />
            </td>
            <td class="px-4 py-3 text-center align-middle">
              <input
                :checked="roleGrants[cap]"
                :disabled="readOnly"
                type="checkbox"
                class="size-4 cursor-pointer appearance-auto accent-base-foreground disabled:cursor-not-allowed"
                @change="
                  emit(
                    'toggle',
                    cap,
                    ($event.target as HTMLInputElement).checked
                  )
                "
              />
            </td>
            <td class="px-4 py-3 text-center align-middle">
              <span
                class="icon-[lucide--minus] size-4 text-muted-foreground/60"
                :title="t('prototype.views.members.permissionsTab.never')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { DelegableCapability, RoleGrants } from '../types'

const { roleGrants, readOnly = false } = defineProps<{
  roleGrants: RoleGrants
  readOnly?: boolean
}>()

const emit = defineEmits<{
  toggle: [capability: DelegableCapability, value: boolean]
}>()

const { t } = useI18n()

const capabilities: DelegableCapability[] = [
  'publish-direct-link',
  'submit-to-hub',
  'approve-hub-submissions',
  'edit-allowlists',
  'configure-workspace'
]

const i18nKeyByCapability: Record<DelegableCapability, string> = {
  'publish-direct-link': 'publishDirectLink',
  'submit-to-hub': 'submitToHub',
  'approve-hub-submissions': 'approveHubSubmissions',
  'edit-allowlists': 'editAllowlists',
  'configure-workspace': 'configureWorkspace'
}

function capabilityI18nKey(cap: DelegableCapability): string {
  return i18nKeyByCapability[cap]
}
</script>
