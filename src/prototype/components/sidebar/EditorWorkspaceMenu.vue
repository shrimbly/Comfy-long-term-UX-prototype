<template>
  <WorkspaceChip
    v-if="currentWorkspace && fixture.mode === 'cloud'"
    compact
    :workspace="currentWorkspace"
    :workspaces="fixture.workspaces"
    :current-user="fixture.currentUser"
    @select-workspace="switchWorkspace"
    @open-settings="showSettings"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../../stores/tabsStore'
import WorkspaceChip from './WorkspaceChip.vue'

const router = useRouter()
const tabs = usePrototypeTabsStore()
const cloud = usePrototypeCustomCloudStore()
const { fixture, currentWorkspace } = storeToRefs(usePrototypePersonaStore())

async function showSettings() {
  tabs.select(HOME_TAB_ID)
  await router.push({ name: 'PrototypeDashboard' })
}

async function switchWorkspace(workspaceId: string) {
  cloud.switchWorkspace(workspaceId)
  await router.push({ name: 'PrototypeDashboard' })
}
</script>
