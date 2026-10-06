<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-10 text-sm">
    <section>
      <h3 class="mb-1 font-semibold">
        {{ t('prototype.settings.billing.balance') }}
      </h3>
      <p class="mb-4 text-muted-foreground">
        {{ t('prototype.settings.billing.balanceHint') }}
      </p>
      <div
        class="flex items-center justify-between rounded-lg border border-border-subtle bg-secondary-background/30 p-5"
      >
        <div>
          <p class="m-0 text-muted-foreground">
            {{ t('prototype.settings.billing.available') }}
          </p>
          <p class="mt-2 mb-0 text-2xl font-semibold tabular-nums">
            {{ billing.creditBalance.remaining.toLocaleString() }}
          </p>
        </div>
        <Button variant="secondary" @click="preview">{{
          t('prototype.settings.billing.buy')
        }}</Button>
      </div>
      <div
        class="mt-3 divide-y divide-border-subtle rounded-lg border border-border-subtle bg-secondary-background/30"
      >
        <div class="grid divide-border-subtle sm:grid-cols-2 sm:divide-x">
          <div class="p-5">
            <p class="mb-2 text-muted-foreground">
              {{ t('prototype.settings.billing.planCredits') }}
            </p>
            <p class="tabular-nums">
              {{ billing.creditBalance.remaining.toLocaleString() }}
              <span class="text-muted-foreground"
                >/
                {{
                  billing.creditBalance.monthlyAllowance.toLocaleString()
                }}</span
              >
            </p>
            <div
              class="mt-5 flex justify-between gap-4 text-xs text-muted-foreground"
            >
              <span>{{
                t('prototype.settings.billing.refills', {
                  date: date(billing.creditBalance.resetsAt)
                })
              }}</span
              ><span>{{
                t('prototype.settings.billing.used', { percent: usedPercent })
              }}</span>
            </div>
            <progress
              :value="usedPercent"
              max="100"
              :aria-label="t('prototype.settings.billing.creditUse')"
              class="mt-2 h-1 w-full accent-base-foreground"
            />
          </div>
          <div class="p-5">
            <p class="mb-2 text-muted-foreground">
              {{ t('prototype.settings.billing.extraCredits') }}
            </p>
            <p class="tabular-nums">{{ (0).toLocaleString() }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between gap-4 p-5">
          <div>
            <p class="m-0">
              {{ t('prototype.settings.billing.autoReload') }}
              <span class="ml-2 text-muted-foreground">{{
                t('prototype.settings.billing.off')
              }}</span>
            </p>
            <p class="mt-2 mb-0 text-muted-foreground">
              {{ t('prototype.settings.billing.reloadHint') }}
            </p>
          </div>
          <Button variant="secondary" @click="preview">{{
            t('prototype.settings.billing.setUp')
          }}</Button>
        </div>
      </div>
    </section>
    <section>
      <h3 class="mb-1 font-semibold">
        {{ t('prototype.settings.billing.plan') }}
      </h3>
      <p class="mb-4 text-muted-foreground">
        {{ t('prototype.settings.billing.planHint') }}
      </p>
      <div
        class="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-secondary-background/30 p-5"
      >
        <div>
          <p class="m-0">
            {{ t(`prototype.sidebar.plan.${billing.subscription.plan}`) }}
          </p>
          <p class="mt-2 mb-0 text-muted-foreground">
            {{
              t('prototype.settings.billing.renews', {
                date: date(billing.subscription.renewsAt)
              })
            }}<span v-if="tier === 'team'">
              ·
              {{
                t('prototype.settings.billing.seats', billableMemberCount)
              }}</span
            >
          </p>
        </div>
        <Button variant="secondary" @click="preview">{{
          t('prototype.settings.billing.manage')
        }}</Button>
      </div>
    </section>
    <section>
      <h3 class="mb-1 font-semibold">
        {{ t('prototype.settings.billing.payment') }}
      </h3>
      <p class="mb-4 text-muted-foreground">
        {{ t('prototype.settings.billing.paymentHint') }}
      </p>
      <div
        class="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-secondary-background/30 p-5"
      >
        <div>
          <p class="m-0">
            {{
              billing.paymentMethod.brand ??
              t('prototype.settings.billing.invoice')
            }}
            <span v-if="billing.paymentMethod.last4">
              ···· {{ billing.paymentMethod.last4 }}</span
            >
          </p>
          <p
            v-if="billing.paymentMethod.expiresMonth"
            class="mt-2 mb-0 text-muted-foreground"
          >
            {{
              textT('prototype.settings.billing.expires', {
                date: `${billing.paymentMethod.expiresMonth}/${billing.paymentMethod.expiresYear}`
              })
            }}
          </p>
        </div>
        <Button variant="secondary" @click="preview">{{
          t('prototype.settings.billing.manage')
        }}</Button>
      </div>
    </section>
    <section>
      <h3 class="mb-1 font-semibold">
        {{ t('prototype.settings.billing.invoices') }}
      </h3>
      <p class="mb-4 text-muted-foreground">
        {{ t('prototype.settings.billing.invoiceHint') }}
      </p>
      <div
        class="rounded-lg border border-border-subtle bg-secondary-background/30"
      >
        <div class="flex items-center justify-between p-5">
          <span>{{ t('prototype.settings.billing.history') }}</span
          ><Button
            variant="secondary"
            :aria-expanded="showInvoices"
            @click="showInvoices = !showInvoices"
            >{{
              t(
                showInvoices
                  ? 'prototype.settings.billing.hide'
                  : 'prototype.settings.billing.view'
              )
            }}</Button
          >
        </div>
        <div
          v-if="showInvoices"
          class="divide-y divide-border-subtle border-t border-border-subtle"
        >
          <div
            v-for="invoice in billing.invoices"
            :key="invoice.id"
            class="flex justify-between gap-4 p-4"
          >
            <span>{{ date(invoice.issuedAt) }}</span
            ><span>{{ currency.format(invoice.amountUsd) }}</span
            ><span>{{
              t(
                `prototype.views.settings.billing.invoiceStatus.${invoice.status}`
              )
            }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useTextT } from '../composables/useTextT'
import { useToastStore } from '@/platform/updates/common/toastStore'
import type { WorkspaceBilling, WorkspaceTier } from '../types'
const { billing, tier, billableMemberCount } = defineProps<{
  billing: WorkspaceBilling
  tier: WorkspaceTier
  billableMemberCount: number
}>()
const { t } = useI18n()
const textT = useTextT()
const toast = useToastStore()
const showInvoices = ref(false)
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})
const usedPercent = computed(() =>
  billing.creditBalance.monthlyAllowance
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (1 -
              billing.creditBalance.remaining /
                billing.creditBalance.monthlyAllowance) *
              100
          )
        )
      )
    : 0
)
function date(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
function preview() {
  toast.add({
    severity: 'info',
    summary: t('prototype.settings.billing.preview'),
    life: 3500
  })
}
</script>
