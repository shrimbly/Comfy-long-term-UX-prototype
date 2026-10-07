<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    decision: prototype/design-decisions.md — 2026-10-08 "Import a private
              custom node pack"

  Import a private node pack into the Custom nodes list: a GitHub
  repository at a branch or tag, or a dropped .zip. The pack joins the list
  ticked, and installs like any other pack.
-->
<template>
  <Dialog :open="true" @update:open="(open) => !open && emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="md" class="gap-5 p-8" @interact-outside.prevent>
        <DialogHeader class="flex-col items-stretch gap-1.5 p-0">
          <div class="flex items-center gap-2">
            <DialogTitle class="flex-1 text-2xl">
              {{ t('prototype.customNodes.import.title') }}
            </DialogTitle>
            <DialogClose />
          </div>
          <p class="m-0 text-sm text-muted-foreground">
            {{ t('prototype.customNodes.import.intro') }}
          </p>
        </DialogHeader>

        <Tabs v-model="source" class="gap-5">
          <TabsList
            variant="bordered"
            class="justify-start border-b border-border-subtle"
          >
            <TabsTrigger
              v-for="tab in SOURCES"
              :key="tab"
              variant="flush"
              :value="tab"
              class="border-b-2 border-solid border-transparent data-[state=active]:border-base-foreground"
            >
              <i :class="cn(TAB_ICONS[tab], 'mr-1.5 size-4')" />
              {{ t(`prototype.customNodes.import.${tab}.tab`) }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" class="flex flex-col gap-4">
            <label class="flex flex-col gap-1.5 text-sm">
              {{ t('prototype.customNodes.import.github.url') }}
              <Input
                v-model="repoUrl"
                :placeholder="t('prototype.customNodes.import.github.urlHint')"
                :aria-invalid="showRepoError"
              />
              <span
                v-if="showRepoError"
                class="text-xs text-destructive-background"
              >
                {{ t('prototype.customNodes.import.github.invalid') }}
              </span>
            </label>
            <label class="flex flex-col gap-1.5 text-sm">
              {{ t('prototype.customNodes.import.github.ref') }}
              <Input
                v-model="gitRef"
                :placeholder="t('prototype.customNodes.import.github.refHint')"
              />
            </label>
            <p class="m-0 text-xs text-muted-foreground">
              {{ t('prototype.customNodes.import.github.access') }}
            </p>
          </TabsContent>

          <TabsContent value="zip" class="flex flex-col gap-3">
            <label
              :class="
                cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-default px-6 py-10 text-center text-sm transition-colors hover:bg-secondary-background/40',
                  dragging &&
                    'border-base-foreground bg-secondary-background/40'
                )
              "
              @dragover.prevent="dragging = true"
              @dragleave="dragging = false"
              @drop.prevent="onDrop"
            >
              <i
                :class="
                  cn(
                    'size-6 text-muted-foreground',
                    fileName
                      ? 'icon-[lucide--file-archive]'
                      : 'icon-[lucide--upload]'
                  )
                "
              />
              <span v-if="fileName" class="font-medium">{{ fileName }}</span>
              <template v-else>
                <span class="font-medium">
                  {{ t('prototype.customNodes.import.zip.drop') }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ t('prototype.customNodes.import.zip.browse') }}
                </span>
              </template>
              <input
                type="file"
                accept=".zip,application/zip"
                class="sr-only"
                @change="onPick"
              />
            </label>
            <span v-if="zipError" class="text-xs text-destructive-background">
              {{ t('prototype.customNodes.import.zip.invalid') }}
            </span>
          </TabsContent>
        </Tabs>

        <DialogFooter class="p-0">
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.customNodes.import.cancel') }}
          </Button>
          <Button
            variant="inverted"
            size="lg"
            :disabled="!canImport"
            @click="onImport"
          >
            {{ t('prototype.customNodes.import.add') }}
          </Button>
        </DialogFooter>
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
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import Input from '@/components/ui/input/Input.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'

import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { parseGithubRepo } from '../utils/customNodes'

type Source = 'github' | 'zip'
const SOURCES: Source[] = ['github', 'zip']
const TAB_ICONS: Record<Source, string> = {
  github: 'icon-[lucide--github]',
  zip: 'icon-[lucide--file-archive]'
}

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const store = usePrototypeCustomNodesStore()

const source = ref<Source>('github')
const repoUrl = ref('')
const gitRef = ref('')
const fileName = ref('')
const dragging = ref(false)
const zipError = ref(false)

const repo = computed(() => parseGithubRepo(repoUrl.value))
const showRepoError = computed(() => !!repoUrl.value.trim() && !repo.value)
const canImport = computed(() =>
  source.value === 'github' ? !!repo.value : !!fileName.value
)

function takeFile(file: File | undefined) {
  if (!file) return
  zipError.value = !file.name.toLowerCase().endsWith('.zip')
  fileName.value = zipError.value ? '' : file.name
}

function onDrop(event: DragEvent) {
  dragging.value = false
  takeFile(event.dataTransfer?.files[0])
}

function onPick(event: Event) {
  if (event.target instanceof HTMLInputElement)
    takeFile(event.target.files?.[0])
}

function onImport() {
  const imported = store.importPrivatePack(
    source.value === 'github'
      ? { kind: 'github', url: repoUrl.value, ref: gitRef.value }
      : { kind: 'zip', fileName: fileName.value }
  )
  if (imported) emit('close')
}
</script>
