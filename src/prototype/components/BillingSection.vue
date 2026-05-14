<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workspace.md
             — Billing config; "billing does not auto-transfer with
               ownership transfer" (Lifecycle).
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Workspace level" — Manage billing & subscription, view
             credit balance. Admin-only, not delegable.

  Mirrors the production subscription card layout at
  src/platform/workspace/components/SubscriptionPanelContentWorkspace.vue.
  Uses the prototype Settings design system (SettingsPanel, SettingsSubCard).
-->
<template>
  <div class="flex flex-col gap-6">
    <SettingsPanel>
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-2"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-text-primary">
              {{ tierName }}
            </span>
            <span
              v-if="billing.subscription.status === 'past-due'"
              class="inline-flex h-5 items-center rounded-full bg-warning-background/15 px-2 text-[10px] font-medium tracking-wide text-warning-background uppercase"
            >
              {{ t('prototype.views.settings.billing.status.past-due') }}
            </span>
          </div>
          <div class="flex items-baseline gap-1 font-semibold">
            <span class="text-2xl text-text-primary">${{ tierPrice }}</span>
            <span class="text-base text-text-secondary">
              {{
                tier === 'personal'
                  ? t('subscription.usdPerMonth')
                  : t('subscription.usdPerMonthPerMember')
              }}
            </span>
          </div>
          <div class="text-sm text-text-secondary">
            {{
              billing.subscription.cancelsAt
                ? t('subscription.expiresDate', {
                    date: formattedDate(billing.subscription.cancelsAt)
                  })
                : t('subscription.renewsDate', {
                    date: formattedDate(billing.subscription.renewsAt)
                  })
            }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 md:ml-auto">
          <Button
            v-if="!isFreeTier"
            variant="secondary"
            size="lg"
            @click="onManageStub('payment')"
          >
            {{ t('subscription.managePayment') }}
          </Button>
          <Button variant="inverted" size="lg" @click="onManageStub('plan')">
            {{ t('subscription.upgradePlan') }}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <SettingsSubCard class="flex-1 lg:max-w-sm">
          <div class="flex flex-col gap-2">
            <div class="text-sm text-muted">
              {{ t('subscription.totalCredits') }}
            </div>
            <div class="text-2xl font-bold text-text-primary">
              {{ billing.creditBalance.remaining.toLocaleString() }}
            </div>
          </div>

          <table class="text-sm text-muted">
            <tbody>
              <tr>
                <td
                  class="pr-4 text-left align-middle font-bold text-text-primary"
                >
                  {{ billing.creditBalance.monthlyAllowance.toLocaleString() }}
                  /
                  {{ billing.creditBalance.monthlyAllowance.toLocaleString() }}
                </td>
                <td class="align-middle">
                  {{
                    t(
                      'subscription.creditsRemainingThisMonth',
                      { date: shortDate(billing.creditBalance.resetsAt) },
                      { escapeParameter: false }
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td
                  class="pr-4 text-left align-middle font-bold text-text-primary"
                >
                  0
                </td>
                <td class="align-middle">
                  {{ t('subscription.creditsYouveAdded') }}
                </td>
              </tr>
            </tbody>
          </table>

          <Button
            v-if="!isFreeTier"
            variant="secondary"
            size="lg"
            class="w-full"
            @click="onManageStub('credits')"
          >
            {{ t('subscription.addCredits') }}
          </Button>
        </SettingsSubCard>

        <div class="flex flex-col gap-2">
          <div class="text-sm text-text-primary">
            {{ t('subscription.yourPlanIncludes') }}
          </div>
          <div class="flex flex-col">
            <div
              v-for="benefit in benefits"
              :key="benefit.key"
              class="flex items-center gap-2 py-2"
            >
              <i class="icon-[lucide--check] size-3 text-text-primary" />
              <span class="text-sm text-text-secondary">
                {{ benefit.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SettingsPanel>

    <SettingsPanel v-if="tier === 'team'">
      <div class="flex items-center justify-between gap-1">
        <div class="flex flex-col gap-2">
          <h4 class="m-0 text-sm text-text-primary">
            {{ t('subscription.nextMonthInvoice') }}
          </h4>
          <Button
            variant="link"
            size="sm"
            class="self-start px-0 underline"
            @click="onManageStub('invoices')"
          >
            {{ t('subscription.invoiceHistory') }}
          </Button>
        </div>
        <div class="flex flex-col items-end gap-2">
          <h4 class="m-0 font-bold text-text-primary">
            ${{ nextMonthInvoice }}
          </h4>
          <h5 class="m-0 text-sm text-text-secondary">
            {{ t('subscription.memberCount', billableMemberCount) }}
          </h5>
        </div>
      </div>
    </SettingsPanel>

    <p class="m-0 text-xs text-text-secondary italic">
      {{ t('prototype.views.settings.billing.ownershipNote') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from './settings/SettingsPanel.vue'
import SettingsSubCard from './settings/SettingsSubCard.vue'
import type { WorkspaceBilling, WorkspacePlan, WorkspaceTier } from '../types'

const { billing, tier, billableMemberCount } = defineProps<{
  billing: WorkspaceBilling
  tier: WorkspaceTier
  billableMemberCount: number
}>()

const { t } = useI18n()

const tierPriceByPlan: Record<WorkspacePlan, number> = {
  free: 0,
  professional: 20,
  enterprise: 50
}

const tierNameByPlan: Record<WorkspacePlan, string> = {
  free: 'Free',
  professional: 'Professional',
  enterprise: 'Enterprise'
}

const tierPrice = computed(() => tierPriceByPlan[billing.subscription.plan])
const tierName = computed(() => tierNameByPlan[billing.subscription.plan])
const isFreeTier = computed(() => billing.subscription.plan === 'free')

const nextMonthInvoice = computed(() => tierPrice.value * billableMemberCount)

const benefits = computed(() => {
  if (billing.subscription.plan === 'free') {
    return [
      { key: 'members', label: t('subscription.membersLabel', { count: 1 }) },
      { key: 'credits', label: '100 credits / month' },
      { key: 'support', label: 'Community support' }
    ]
  }
  if (billing.subscription.plan === 'enterprise') {
    return [
      { key: 'members', label: 'Unlimited members' },
      { key: 'credits', label: 'Custom credit allowance' },
      { key: 'sso', label: 'SSO & SCIM' },
      { key: 'support', label: 'Dedicated account manager' }
    ]
  }
  return [
    {
      key: 'members',
      label: t('subscription.membersLabel', {
        count: billing.subscription.seatsIncluded
      })
    },
    { key: 'credits', label: '10,000 credits / month per member' },
    { key: 'partner', label: t('subscription.partnerNodesDescription') },
    { key: 'support', label: 'Priority support' }
  ]
})

function formattedDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function shortDate(value: string): string {
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${month}/${day}/${year}`
}

function onManageStub(_kind: 'plan' | 'payment' | 'credits' | 'invoices') {
  // Prototype stub — real flow would open a modal / Stripe portal.
}
</script>
