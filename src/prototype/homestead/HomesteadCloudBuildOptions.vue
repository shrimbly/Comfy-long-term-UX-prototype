<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { useHomesteadStore } from './store'
const nodes = usePrototypeCustomNodesStore()
const s = useHomesteadStore()
const { t } = useI18n()
function selectFiles(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  nodes.addArchives(Array.from(event.target.files ?? []))
  event.target.value = ''
}
</script>
<template>
  <div
    class="grid shrink-0 gap-5 border-t border-border-subtle px-6 py-4 md:grid-cols-2"
  >
    <div class="space-y-2">
      <label for="hs-private-nodes" class="block text-sm font-medium">{{
        t('homestead.privateNodes')
      }}</label>
      <input
        id="hs-private-nodes"
        type="file"
        accept=".zip,.tar.gz"
        multiple
        :disabled="!s.editableBuild || s.build.phase === 'building'"
        class="w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary-background file:px-3 file:py-2 file:text-base-foreground"
        aria-describedby="hs-private-hint"
        @change="selectFiles"
      />
      <p id="hs-private-hint" class="text-xs leading-5 text-muted-foreground">
        {{ t('homestead.privateNodesHint') }}
      </p>
      <p v-if="nodes.archiveError" role="alert" class="text-xs text-gold-400">
        {{ t('homestead.archiveError') }}
      </p>
      <ul
        v-if="nodes.privateArchives.length"
        class="max-h-20 overflow-y-auto text-xs"
      >
        <li
          v-for="name in nodes.privateArchives"
          :key="name"
          class="flex items-center gap-2"
        >
          <i class="icon-[lucide--lock] size-3 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ name }}</span>
          <Button
            variant="muted-textonly"
            size="icon-sm"
            :aria-label="t('homestead.removeArchive', { name })"
            @click="
              nodes.privateArchives = nodes.privateArchives.filter(
                (archive) => archive !== name
              )
            "
          >
            <i class="icon-[lucide--x] size-3" />
          </Button>
        </li>
      </ul>
    </div>
    <div class="space-y-3">
      <fieldset
        class="m-0 min-w-0 space-y-2 border-0 p-0"
        :disabled="!s.editableBuild || s.build.phase === 'building'"
      >
        <legend class="text-sm font-medium">
          {{ t('homestead.buildDestination') }}
        </legend>
        <div class="flex flex-wrap gap-4 text-xs">
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="cloud-build-mode"
              :checked="nodes.buildMode === 'update'"
              :disabled="s.environment.id === 'dep-comfy-cloud'"
              @change="nodes.setBuildMode('update')"
            />
            {{ t('homestead.updateCurrentBuild') }}
          </label>
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="cloud-build-mode"
              :checked="nodes.buildMode === 'create'"
              @change="nodes.setBuildMode('create')"
            />
            {{ t('homestead.createBuild') }}
          </label>
        </div>
        <label for="hs-cloud-build-name" class="block text-xs">{{
          t('homestead.buildName')
        }}</label>
        <input
          id="hs-cloud-build-name"
          v-model="nodes.buildName"
          class="h-9 w-full rounded-lg border border-border-default bg-secondary-background px-3 text-sm"
        />
      </fieldset>
      <p class="text-xs leading-5 text-muted-foreground">
        {{
          t(
            nodes.buildMode === 'update'
              ? 'homestead.updateBuildHint'
              : 'homestead.newBuildHint'
          )
        }}
      </p>
    </div>
  </div>
</template>
