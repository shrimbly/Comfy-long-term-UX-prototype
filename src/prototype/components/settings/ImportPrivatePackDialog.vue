<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
              — packs are allowlist configuration, so a private one joins
              the workspace allowlist
    log:      prototype/design-decisions.md — 2026-10-07 "Private custom
              node packs: import a zip or link a repo"

  A custom node pack that is not in the registry. Upload a zip or link a
  git repo; the pack is private to this workspace and allowed right away.
-->
<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent class="shadow-none" size="md">
        <DialogHeader>
          <DialogTitle>
            {{ t('prototype.settings.policies.import.title') }}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        <form class="flex flex-col gap-5 px-6 py-4" @submit.prevent="submit">
          <DialogDescription>
            {{
              textT('prototype.settings.policies.import.hint', {
                workspace: personas.currentWorkspace?.name
              })
            }}
          </DialogDescription>

          <div
            role="radiogroup"
            class="grid grid-cols-2 gap-1 rounded-xl bg-secondary-background/40 p-1"
          >
            <button
              v-for="option in sources"
              :key="option.kind"
              type="button"
              role="radio"
              :aria-checked="source === option.kind"
              :class="
                cn(
                  'flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  source === option.kind
                    ? 'border-base-foreground bg-base-background'
                    : 'border-transparent bg-transparent hover:bg-secondary-background-hover'
                )
              "
              @click="source = option.kind"
            >
              <span class="flex items-center gap-2 text-sm font-medium">
                <i :class="cn(option.icon, 'size-4')" />
                {{ option.label }}
              </span>
              <span class="text-xs text-muted-foreground">{{
                option.hint
              }}</span>
            </button>
          </div>

          <label v-if="source === 'zip'" class="flex flex-col gap-1.5">
            <span class="text-sm">
              {{ t('prototype.settings.policies.import.zipLabel') }}
            </span>
            <span
              class="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-default text-sm text-muted-foreground hover:border-base-foreground"
            >
              <i class="icon-[lucide--upload] size-5" />
              <span v-if="zipName" class="text-base-foreground">
                {{ zipName }}
              </span>
              <span v-else>
                {{ t('prototype.settings.policies.import.zipDrop') }}
              </span>
              <input
                type="file"
                accept=".zip"
                class="sr-only"
                @change="onFile"
              />
            </span>
          </label>

          <label v-else class="flex flex-col gap-1.5">
            <span class="text-sm">
              {{ t('prototype.settings.policies.import.repoLabel') }}
            </span>
            <Input
              v-model="repoUrl"
              type="url"
              class="h-10"
              :placeholder="
                t('prototype.settings.policies.import.repoPlaceholder')
              "
            />
            <span class="text-xs text-muted-foreground">
              {{ t('prototype.settings.policies.import.repoHint') }}
            </span>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm">
              {{ t('prototype.settings.policies.import.nameLabel') }}
            </span>
            <Input v-model="name" class="h-10" :placeholder="suggestedName" />
          </label>

          <DialogFooter class="px-0 pb-0">
            <Button
              variant="muted-textonly"
              type="button"
              @click="emit('close')"
            >
              {{ t('g.cancel') }}
            </Button>
            <Button variant="secondary" type="submit" :disabled="!canSubmit">
              {{ t('prototype.settings.policies.import.submit') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import Input from '@/components/ui/input/Input.vue'

import { useTextT } from '../../composables/useTextT'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypePolicyStore } from '../../stores/policyStore'
import type { PrivatePackSource } from '../../stores/policyStore'

const emit = defineEmits<{
  close: []
  imported: [name: string]
}>()

const { t } = useI18n()
const textT = useTextT()
const personas = usePrototypePersonaStore()
const policies = usePrototypePolicyStore()

const source = ref<PrivatePackSource['kind']>('zip')
const zipName = ref('')
const repoUrl = ref('')
const name = ref('')

const sources = computed(() => [
  {
    kind: 'zip' as const,
    icon: 'icon-[lucide--file-archive]',
    label: t('prototype.settings.policies.import.zip'),
    hint: t('prototype.settings.policies.import.zipHint')
  },
  {
    kind: 'repo' as const,
    icon: 'icon-[lucide--git-branch]',
    label: t('prototype.settings.policies.import.repo'),
    hint: t('prototype.settings.policies.import.repoShort')
  }
])

// The pack's name defaults to the file or the repo it came from.
const suggestedName = computed(() => {
  if (source.value === 'zip') return zipName.value.replace(/\.zip$/i, '')
  const last = repoUrl.value.trim().split('/').filter(Boolean).at(-1) ?? ''
  return last.replace(/\.git$/i, '')
})

const sourceReady = computed(() =>
  source.value === 'zip'
    ? zipName.value.length > 0
    : /^https?:\/\/\S+\/\S+/.test(repoUrl.value.trim())
)
const canSubmit = computed(
  () => sourceReady.value && (name.value.trim() || suggestedName.value)
)

function onFile(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  zipName.value = input.files?.[0]?.name ?? ''
}

function submit() {
  if (!canSubmit.value) return
  const packName = name.value.trim() || suggestedName.value
  const packSource: PrivatePackSource =
    source.value === 'zip'
      ? { kind: 'zip', label: zipName.value }
      : { kind: 'repo', label: repoUrl.value.trim() }
  if (policies.importPrivatePack(packName, packSource)) {
    emit('imported', packName)
    emit('close')
  }
}
</script>
