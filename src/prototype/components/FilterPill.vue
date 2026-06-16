<!--
  Filter chip for list-toolbar filter rows (Recents, Projects). Active =
  inverted, inactive = secondary. Matches the toolbar dropdown's size + corner
  radius (Button size md → h-8, rounded-lg) so the filter row reads as one set
  of controls.
-->
<template>
  <Button
    :variant="active ? 'inverted' : 'secondary'"
    size="md"
    @click="emit('click')"
  >
    {{ label }}
  </Button>
</template>

<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'

const { label, active = false } = defineProps<{
  label: string
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>
