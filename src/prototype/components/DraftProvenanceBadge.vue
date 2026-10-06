<!--
  Provenance marker for a workflow connected to a project, shown after the
  date. A link glyph whose hover tooltip reads "{project}: {workflow}" — the
  project it belongs to and the workflow it tracks. A copy whose source
  canonical is gone shows an unlink glyph ("Source removed").
-->
<template>
  <span class="inline-flex items-center">
    <Tooltip v-if="meta.state === 'linked'" :text="linkTitle">
      <i class="icon-[lucide--link] size-3.5 text-muted-foreground" />
    </Tooltip>
    <Tooltip
      v-else
      :text="t('prototype.views.project.draftProvenance.sourceRemoved')"
    >
      <i class="icon-[lucide--unlink] size-3.5 text-destructive-background" />
    </Tooltip>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Tooltip from './Tooltip.vue'
import type { DraftMeta } from '../types'

const { meta } = defineProps<{ meta: DraftMeta }>()

const { t } = useI18n()

const linkTitle = computed(() =>
  t('prototype.views.project.draftProvenance.link', {
    project: meta.projectName,
    workflow: meta.workflowName
  })
)
</script>
