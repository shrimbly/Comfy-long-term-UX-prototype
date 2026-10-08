<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@comfyorg/tailwind-utils'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { PLATFORM_GPUS } from '../fixtures/customCloud'
import { desktopBuildPrompt, latestBuilds } from './agentModel'
import type { DesktopBuildRequest } from './agentModel'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
const mode = ref<'create' | 'update'>('create')
const name = ref(`${s.active.name} Cloud`)
const gpu = ref('RTX PRO 6000')
const instructions = ref('')
const builds = computed(() => latestBuilds(s.availableEnvironments))
const sourceId = ref(builds.value[0]?.id ?? '')
const source = computed(() =>
  builds.value.find((build) => build.id === sourceId.value)
)
const gpuOptions = computed(() => [
  ...new Set([
    ...PLATFORM_GPUS.map((option) => option.label),
    ...(source.value ? [source.value.gpu] : [])
  ])
])
const request = computed<DesktopBuildRequest>(() => ({
  name: name.value.trim(),
  gpu: gpu.value,
  instructions: instructions.value,
  ...(mode.value === 'create'
    ? { mode: 'create' as const }
    : { mode: 'update' as const, sourceId: sourceId.value })
}))
const prompt = computed(() =>
  desktopBuildPrompt(request.value, s.active, s.workspaceName)
)
const valid = computed(
  () =>
    name.value.trim().length > 0 && (mode.value === 'create' || !!source.value)
)
function selectSource() {
  if (!source.value) return
  name.value = source.value.name
  gpu.value = source.value.gpu
}
function selectMode(next: 'create' | 'update') {
  mode.value = next
  if (next === 'update') selectSource()
  else {
    name.value = `${s.active.name} Cloud`
    gpu.value = 'RTX PRO 6000'
  }
}
function submit() {
  if (valid.value) s.startBuild('agent', request.value)
}
</script>
<template>
  <form class="space-y-5" @submit.prevent="submit">
    <fieldset class="m-0 min-w-0 space-y-2 border-0 p-0">
      <legend class="mb-2 text-sm font-medium">
        {{ t('homestead.buildDestination') }}
      </legend>
      <div class="grid grid-cols-2 gap-2">
        <label
          v-for="option in ['create', 'update'] as const"
          :key="option"
          :class="
            cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm',
              mode === option
                ? 'border-base-foreground bg-secondary-background'
                : 'border-border-subtle'
            )
          "
        >
          <input
            type="radio"
            name="build-mode"
            :value="option"
            :checked="mode === option"
            :disabled="option === 'update' && !builds.length"
            class="size-3.5 accent-base-foreground"
            @change="selectMode(option)"
          />{{ t(`homestead.${option}Build`) }}
        </label>
      </div>
    </fieldset>
    <label v-if="mode === 'update'" class="block space-y-2 text-sm"
      ><span>{{ t('homestead.existingBuild') }}</span>
      <select
        v-model="sourceId"
        class="h-10 w-full rounded-lg border border-border-default bg-base-background px-3 text-sm"
        @change="selectSource"
      >
        <option v-for="build in builds" :key="build.id" :value="build.id">
          {{ build.name }} · {{ build.revision }}
        </option>
      </select>
      <span class="block text-xs leading-5 text-muted-foreground">{{
        t('homestead.updateBuildHint')
      }}</span>
    </label>
    <div class="grid grid-cols-2 gap-4">
      <label class="space-y-2 text-sm"
        ><span>{{ t('homestead.buildName') }}</span
        ><Input
          v-model="name"
          required
          maxlength="80"
          :aria-label="t('homestead.buildName')"
      /></label>
      <label class="space-y-2 text-sm"
        ><span>{{ t('homestead.gpu') }}</span
        ><select
          v-model="gpu"
          :aria-label="t('homestead.gpu')"
          class="h-10 w-full rounded-lg border border-border-default bg-base-background px-3 text-sm"
        >
          <option v-for="option in gpuOptions" :key="option">
            {{ option }}
          </option>
        </select></label
      >
    </div>
    <div
      class="flex items-center gap-3 rounded-lg border border-border-subtle bg-secondary-background/30 px-3 py-3"
    >
      <i class="icon-[lucide--workflow] size-5 text-muted-foreground" />
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ s.active.name }}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ t('homestead.currentDesktopWorkflow') }} · {{ s.workspaceName }}
        </p>
      </div>
    </div>
    <label class="block space-y-2 text-sm"
      ><span
        >{{ t('homestead.agentInstructions') }}
        <span class="text-muted-foreground">{{
          t('homestead.optional')
        }}</span></span
      ><textarea
        v-model="instructions"
        rows="3"
        maxlength="2000"
        :aria-label="t('homestead.agentInstructions')"
        :placeholder="t('homestead.instructionsPlaceholder')"
        class="w-full resize-y rounded-lg border border-border-default bg-base-background px-3 py-2 font-sans text-sm outline-none focus:border-base-foreground"
      />
    </label>
    <details class="rounded-lg border border-border-subtle text-xs">
      <summary class="cursor-pointer px-3 py-3 text-muted-foreground">
        {{ t('homestead.reviewAgentPrompt') }}
      </summary>
      <pre
        class="max-h-48 overflow-auto border-t border-border-subtle px-3 py-3 font-sans leading-5 whitespace-pre-wrap"
        >{{ prompt }}</pre>
    </details>
    <p class="text-xs leading-5 text-muted-foreground">
      {{ t('homestead.billing') }}
    </p>
    <p v-if="!s.editableBuild" class="text-xs text-gold-400">
      {{ t('homestead.permission') }}
    </p>
    <div
      class="sticky -bottom-6 z-10 -mx-6 flex justify-end gap-2 border-t border-border-subtle bg-base-background px-6 py-4"
    >
      <Button type="button" variant="textonly" @click="s.dialog = null">{{
        t('homestead.cancel')
      }}</Button
      ><Button
        type="submit"
        variant="inverted"
        :disabled="!valid || !s.editableBuild || s.build.phase === 'building'"
        ><i class="icon-[lucide--sparkles] size-4" />{{
          t('homestead.sendToAgent')
        }}</Button
      >
    </div>
  </form>
</template>
