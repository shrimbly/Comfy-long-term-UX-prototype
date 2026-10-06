import { until } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { t } from '@/i18n'
import { useToastStore } from '@/platform/updates/common/toastStore'

export const usePrototypeNavigationStore = defineStore(
  'prototype-navigation',
  () => {
    const router = useRouter()
    const editorReady = ref(false)
    const openingEditor = ref(false)

    async function openEditor(): Promise<boolean> {
      if (openingEditor.value) return false
      openingEditor.value = true
      try {
        await router.push({ name: 'GraphView' })
        if (router.currentRoute.value.name !== 'GraphView') return false
        await until(editorReady).toBe(true, {
          timeout: 30000,
          throwOnTimeout: true
        })
        return router.currentRoute.value.name === 'GraphView'
      } catch (error) {
        console.error('Unable to open the workflow editor', error)
        useToastStore().add({
          severity: 'error',
          summary: t('prototype.tabs.editorUnavailable'),
          life: 5000
        })
        return false
      } finally {
        openingEditor.value = false
      }
    }

    return { editorReady, openingEditor, openEditor }
  }
)
