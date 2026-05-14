<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — workspace level
    flow:    ../IA_Plan/wiki/concepts/personas-and-flows.md — "Send invite"

  Workspace invite dialog. Email + role picker. Members can invite, not
  just Admins (wiki: workspace permissions). Promoting to Admin is only
  available to existing Admins; Members can pick Member or Guest.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <div
        class="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <header class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold">
            {{
              t('prototype.views.members.inviteDialog.title', {
                workspace: workspaceName
              })
            }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ t('prototype.views.members.inviteDialog.subtitle') }}
          </p>
        </header>

        <label class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.members.inviteDialog.emailLabel') }}
          </span>
          <input
            ref="emailInput"
            v-model="email"
            type="email"
            :placeholder="
              t('prototype.views.members.inviteDialog.emailPlaceholder')
            "
            class="h-10 rounded-lg border border-border-subtle bg-secondary-background px-3 text-sm outline-none focus:border-base-foreground"
            @keydown.enter="submit"
          />
        </label>

        <fieldset class="flex flex-col gap-2">
          <legend
            class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.members.inviteDialog.roleLabel') }}
          </legend>
          <label
            v-for="opt in roleOptions"
            :key="opt.role"
            :class="
              cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                role === opt.role
                  ? 'border-base-foreground bg-secondary-background'
                  : 'border-border-subtle hover:bg-secondary-background'
              )
            "
          >
            <input
              v-model="role"
              type="radio"
              :value="opt.role"
              class="mt-0.5"
            />
            <span class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">
                {{ t(`prototype.sidebar.role.${opt.role}`) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{
                  t(`prototype.views.members.inviteDialog.roleHint.${opt.role}`)
                }}
              </span>
            </span>
          </label>
        </fieldset>

        <footer class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="h-10 cursor-pointer rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-background"
            @click="$emit('close')"
          >
            {{ t('prototype.views.members.inviteDialog.cancel') }}
          </button>
          <button
            type="button"
            :disabled="!isValid"
            :class="
              cn(
                'h-10 rounded-lg px-4 text-sm font-medium transition-colors',
                isValid
                  ? 'cursor-pointer bg-base-foreground text-base-background hover:opacity-90'
                  : 'cursor-not-allowed bg-secondary-background text-muted-foreground'
              )
            "
            @click="submit"
          >
            {{ t('prototype.views.members.inviteDialog.submit') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { WorkspaceRole } from '../types'

const { workspaceName, canInviteAdmins = false } = defineProps<{
  workspaceName: string
  canInviteAdmins?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [{ email: string; role: WorkspaceRole }]
}>()

const { t } = useI18n()

const email = ref('')
const role = ref<WorkspaceRole>('member')
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

const roleOptions = computed<Array<{ role: WorkspaceRole }>>(() => {
  const opts: Array<{ role: WorkspaceRole }> = [
    { role: 'member' },
    { role: 'guest' }
  ]
  if (canInviteAdmins) opts.unshift({ role: 'admin' })
  return opts
})

const isValid = computed(() => /.+@.+\..+/.test(email.value.trim()))

function submit() {
  if (!isValid.value) return
  emit('submit', { email: email.value.trim(), role: role.value })
}

onMounted(() => {
  emailInput.value?.focus()
})
</script>
