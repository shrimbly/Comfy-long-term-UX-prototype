<template>
  <div class="flex size-full flex-col overflow-hidden bg-base-background">
    <PrototypeTabs v-if="route.name !== 'HomesteadDeployment'" />
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <main
        v-if="editorMounted"
        v-show="isEditorRoute"
        :inert="!isEditorRoute"
        class="size-full"
      >
        <WorkspaceAuthGate>
          <GraphView />
        </WorkspaceAuthGate>
      </main>
      <router-view v-if="!isEditorRoute" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFavicon } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import WorkspaceAuthGate from '@/platform/workspace/auth/WorkspaceAuthGate.vue'
import PrototypeTabs from '@/prototype/components/PrototypeTabs.vue'

const GraphView = defineAsyncComponent(
  async () => (await import('@/views/GraphView.vue')).default
)
const route = useRoute()
const isEditorRoute = computed(() => route.name === 'GraphView')
const editorMounted = ref(false)
watch(
  isEditorRoute,
  (active) => {
    if (active) editorMounted.value = true
  },
  { immediate: true }
)

useFavicon('/assets/favicon.ico')
</script>
