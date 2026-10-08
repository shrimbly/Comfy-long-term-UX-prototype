<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import Button from '@/components/ui/button/Button.vue'
import PopoverContent from '@/components/ui/popover/PopoverContent.vue'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { useHomesteadStore } from './store'
import HomesteadConfig from './HomesteadConfig.vue'
import { usePrototypeUiStore } from '../stores/uiStore'
import { compatibility } from './model'
const s = useHomesteadStore()
const tabs = usePrototypeTabsStore()
const nodes = usePrototypeCustomNodesStore()
const ui = usePrototypeUiStore()
const { t } = useI18n()
const editing = computed(() =>
  tabs.openTabs.some(
    (tab) => tab.id === tabs.activeTabId && tab.kind === 'workflow'
  )
)
function switchPreview(target: 'desktop' | 'cloud') {
  s.dialog = null
  s.agentOpen = false
  if (target === 'desktop') {
    s.openWorkflow(editing.value ? s.activeId : 'matte', 'desktop')
    return
  }
  if (s.version === 3) {
    s.entry = 'cloud'
    tabs.select(HOME_TAB_ID)
    ui.go({ kind: 'projects' })
    s.view = 'projects'
    return
  }
  if (s.compatible.status !== 'compatible') {
    const compatible = s.availableEnvironments.find(
      (environment) =>
        compatibility(s.active, environment).status === 'compatible'
    )
    if (compatible) s.switchEnvironment(compatible.id)
  }
  s.openWorkflow(s.activeId, 'cloud')
}
</script>
<template>
  <div
    class="flex min-h-10 shrink-0 flex-wrap items-center gap-1 border-b border-border-subtle bg-base-background px-3 py-1 text-base-foreground"
  >
    <div
      role="group"
      :aria-label="t('homestead.previewMode')"
      class="mr-2 flex items-center gap-1 rounded-lg bg-secondary-background p-1"
    >
      <span class="px-2 text-xs text-muted-foreground">{{
        t('homestead.preview')
      }}</span>
      <Button
        :variant="s.entry === 'desktop' ? 'inverted' : 'muted-textonly'"
        size="sm"
        :aria-pressed="s.entry === 'desktop'"
        @click="switchPreview('desktop')"
      >
        <i class="icon-[lucide--monitor] size-3.5" />{{
          t('homestead.previewLocal')
        }}
      </Button>
      <Button
        :variant="s.entry === 'cloud' ? 'inverted' : 'muted-textonly'"
        size="sm"
        :aria-pressed="s.entry === 'cloud'"
        @click="switchPreview('cloud')"
      >
        <i class="icon-[lucide--cloud] size-3.5" />{{
          t('homestead.previewCloud')
        }}
      </Button>
      <Button
        as="a"
        href="/prototype/homestead/deployment#builds"
        variant="muted-textonly"
        size="sm"
        class="no-underline"
      >
        <i class="icon-[lucide--server] size-3.5" />
        {{ t('homestead.deploymentScreen.deployment') }}
      </Button>
    </div>
    <template v-if="editing">
      <Button
        variant="muted-textonly"
        size="sm"
        :disabled="!s.allowed"
        @click="s.dialog = 'environment'"
      >
        <i class="icon-[lucide--server] size-3.5" />
        {{
          s.entry === 'desktop'
            ? t('homestead.localRuntime')
            : `${s.environment.name} · ${s.environment.revision}`
        }}
        <i class="icon-[lucide--chevron-down] size-3" />
      </Button>
      <span class="px-2 text-xs text-muted-foreground" role="status">{{
        t(
          s.activeJob?.status === 'cold-start'
            ? 'homestead.jobPreparing'
            : s.activeJob?.status === 'running'
              ? 'homestead.jobRunning'
              : `homestead.${s.runtime}`
        )
      }}</span>
      <span v-if="s.version === 3" class="text-xs text-muted-foreground">{{
        t('homestead.projectScope')
      }}</span>
      <Button
        v-if="s.entry === 'cloud'"
        variant="muted-textonly"
        size="sm"
        @click="
          s.version >= 2 ? nodes.open() : s.editBuildFor(s.environment.id)
        "
        >{{ t('homestead.editBuild') }}</Button
      >
      <Button
        v-if="s.version >= 2"
        variant="muted-textonly"
        size="sm"
        @click="nodes.open()"
        >{{ t('homestead.nativeManager') }}</Button
      >
      <Button variant="muted-textonly" size="sm" @click="s.dialog = 'local'">{{
        t('homestead.develop')
      }}</Button>
    </template>
    <template v-else>
      <Button variant="muted-textonly" size="sm" @click="s.importWorkflow()"
        ><i class="icon-[lucide--upload] size-3.5" />{{
          t('homestead.import')
        }}</Button
      >
    </template>
    <Button
      v-if="s.updateEnvironment && s.updateEnvironment.id !== s.environment.id"
      variant="textonly"
      size="sm"
      @click="s.dialog = 'update'"
      >{{ t('homestead.updateAvailable') }}</Button
    >
    <Button
      v-if="s.build.phase !== 'idle'"
      variant="muted-textonly"
      size="sm"
      @click="s.agentOpen = !s.agentOpen"
      >{{
        t(
          s.buildSurface === 'agent'
            ? 'homestead.agent'
            : 'homestead.buildProgress'
        )
      }}</Button
    >
    <div class="ml-auto flex items-center gap-2">
      <span class="text-xs text-muted-foreground"
        >{{ t('homestead.title') }} · {{ `V${s.version}` }}</span
      >
      <PopoverRoot v-model:open="s.configOpen"
        ><PopoverTrigger as-child
          ><Button
            variant="muted-textonly"
            size="icon-sm"
            :aria-label="t('homestead.openConfig')"
            ><i class="icon-[lucide--sliders-horizontal] size-4" /></Button
        ></PopoverTrigger>
        <PopoverContent
          align="end"
          class="overflow-hidden rounded-xl border-border-default bg-base-background p-0 shadow-lg"
          ><HomesteadConfig
        /></PopoverContent>
      </PopoverRoot>
    </div>
  </div>
</template>
