<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              §"member-overwrite-request-flow" — declining a submission
              requires feedback, which is sent back to the submitter.

  Required-comment dialog shown before a Decline goes through. The Decline
  button stays disabled until the reviewer writes something.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div
        class="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <div class="flex flex-col gap-1">
          <h2 class="m-0 text-lg font-semibold">
            {{ t('prototype.submissionReview.declineTitle') }}
          </h2>
          <p class="m-0 text-sm text-muted-foreground">
            {{
              t('prototype.submissionReview.declineSubtitle', {
                user: submitterName
              })
            }}
          </p>
        </div>

        <textarea
          v-model="comment"
          rows="4"
          class="w-full resize-none rounded-lg border border-border-default bg-secondary-background p-3 text-sm text-base-foreground outline-none focus:border-primary-background"
          :placeholder="t('prototype.submissionReview.declinePlaceholder')"
        />

        <footer class="flex justify-end gap-2">
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.submissionReview.declineCancel') }}
          </Button>
          <Button
            variant="primary"
            size="lg"
            :disabled="!comment.trim()"
            @click="emit('confirm', comment.trim())"
          >
            {{ t('prototype.submissionReview.declineConfirm') }}
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

const { submitterName } = defineProps<{
  submitterName: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [comment: string]
}>()

const { t } = useI18n()
const comment = ref('')
</script>
