<!--
  Implements:
    flow: ../prototype/flows/07-custom-cloud-happy-path.md — presenter
          controls

  Presenter-only controls beside the persona toggle: open the incompatible
  matte_pass workflow without a real file drop, and reset the demo. Every
  prototype store is in memory, so a page reload is the reset: back to the
  seed fixtures, whatever state the demo was left in.
-->
<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="customCloud.isEnabled"
      variant="secondary"
      size="md"
      @click="customCloud.dropIncompatibleWorkflow()"
    >
      {{ t('prototype.customCloud.demo.drop') }}
    </Button>
    <Button variant="muted-textonly" size="md" @click="resetDemo">
      {{ t('prototype.customCloud.demo.reset') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

function resetDemo() {
  window.location.reload()
}
</script>
