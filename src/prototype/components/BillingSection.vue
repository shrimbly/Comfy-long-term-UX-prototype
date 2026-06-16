<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workspace.md
             — Billing config; "billing does not auto-transfer with
               ownership transfer" (Lifecycle).
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Workspace level" — Manage billing & subscription, view
             credit balance. Admin-only, not delegable.

  Layout follows the older Plan & Credits design
    (Figma: Team Plan — Workspaces, node 2993:14790).
  A bordered section frames the plan header + actions, a raised credits
  card with a monthly-usage bar, and the plan perks; a help footer with
  support links and invoice history sits below.
-->
<template>
  <div class="flex flex-col gap-6">
    <section
      class="flex w-full flex-col gap-9 rounded-2xl border border-border-subtle p-6"
    >
      <header class="flex items-start gap-4">
        <div class="flex flex-1 flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-base-foreground">
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
            <span class="text-2xl text-base-foreground"
              >${{ monthlyTotal }}</span
            >
            <span class="text-base font-normal text-muted-foreground">
              {{ t('subscription.usdPerMonth') }}
            </span>
          </div>
          <div class="text-sm text-muted-foreground">
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

        <div class="flex items-start justify-end gap-2">
          <Button
            variant="secondary"
            size="lg"
            @click="onManageStub('payment')"
          >
            {{ t('prototype.views.settings.billing.manageBilling') }}
          </Button>
          <Button variant="secondary" size="lg" @click="onManageStub('plan')">
            {{ planActionLabel }}
          </Button>
          <Button
            variant="secondary"
            size="icon-lg"
            :aria-label="t('prototype.views.settings.billing.moreActions')"
            @click="onManageStub('more')"
          >
            <i class="icon-[lucide--ellipsis] size-4" />
          </Button>
        </div>
      </header>

      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div
          class="flex w-full flex-col gap-6 rounded-2xl border border-border-subtle bg-secondary-background px-6 py-5 lg:w-md"
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">
                {{ t('subscription.totalCredits') }}
              </span>
              <button
                type="button"
                class="flex cursor-pointer appearance-none items-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-base-foreground"
                :aria-label="t('subscription.refreshCredits')"
                @click="onManageStub('refresh')"
              >
                <i class="icon-[lucide--refresh-ccw] size-4" />
              </button>
            </div>
            <div class="flex items-center gap-1">
              <i
                class="icon-[comfy--credits] size-4 shrink-0 text-warning-background"
              />
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-base-foreground">
                  {{ fmt(creditsRemaining) }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ t('prototype.views.settings.billing.creditsRemaining') }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-base-foreground">
                {{ t('subscription.monthly') }}
              </span>
              <span class="text-muted-foreground">
                {{
                  t('prototype.views.settings.billing.refills', {
                    date: shortDate(billing.creditBalance.resetsAt)
                  })
                }}
              </span>
            </div>
            <div
              class="h-2 w-full overflow-hidden rounded-full bg-secondary-background-hover"
            >
              <div
                class="h-full rounded-full bg-warning-background"
                :style="{ width: `${usedPercent}%` }"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">
                {{
                  t('prototype.views.settings.billing.creditsUsed', {
                    count: fmt(creditsUsed)
                  })
                }}
              </span>
              <div class="flex items-center gap-1">
                <i
                  class="icon-[comfy--credits] size-4 shrink-0 text-warning-background"
                />
                <span class="text-sm font-bold text-base-foreground">
                  {{
                    t('prototype.views.settings.billing.creditsLeftOf', {
                      remaining: fmt(creditsRemaining),
                      total: fmt(monthlyAllowance)
                    })
                  }}
                </span>
              </div>
            </div>
          </div>

          <hr class="m-0 w-full border-0 border-t border-border-subtle" />

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <span class="text-sm text-base-foreground">
                  {{ t('prototype.views.settings.billing.additionalCredits') }}
                </span>
                <i class="icon-[lucide--info] size-4 text-muted-foreground" />
              </div>
              <div class="flex items-center gap-1">
                <i
                  class="icon-[comfy--credits] size-4 shrink-0 text-warning-background"
                />
                <span class="text-sm font-bold text-base-foreground">
                  {{ fmt(additionalCredits) }}
                </span>
              </div>
            </div>
            <span class="text-sm text-muted-foreground">
              {{ t('prototype.views.settings.billing.additionalCreditsHint') }}
            </span>
          </div>

          <Button
            variant="secondary"
            size="lg"
            class="w-full"
            @click="onManageStub('credits')"
          >
            {{ t('subscription.addCredits') }}
          </Button>
        </div>

        <div class="flex flex-1 flex-col gap-4">
          <p class="m-0 text-sm text-muted-foreground">
            {{ t('subscription.yourPlanIncludes') }}
          </p>
          <div
            v-for="benefit in benefits"
            :key="benefit.key"
            class="flex items-center gap-2"
          >
            <i
              class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
            />
            <span class="text-sm text-base-foreground">{{
              benefit.label
            }}</span>
          </div>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="flex w-fit cursor-pointer appearance-none items-center gap-2 border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-base-foreground"
      @click="onManageStub('plan')"
    >
      <span class="text-sm">{{ t('subscription.viewMoreDetailsPlans') }}</span>
      <i class="icon-[lucide--external-link] size-4" />
    </button>

    <hr class="m-0 w-full border-0 border-t border-border-subtle" />

    <div class="flex items-center justify-between">
      <div
        class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
      >
        <button
          v-for="link in helpLinks"
          :key="link.key"
          type="button"
          class="flex cursor-pointer appearance-none items-center gap-1 border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-base-foreground"
          @click="onManageStub('help')"
        >
          <i :class="cn('size-4', link.icon)" />
          <span>{{ link.label }}</span>
        </button>
      </div>
      <button
        type="button"
        class="flex cursor-pointer appearance-none items-center gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground transition-colors hover:text-base-foreground"
        @click="onManageStub('invoices')"
      >
        <span>{{ t('subscription.invoiceHistory') }}</span>
        <i class="icon-[lucide--external-link] size-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

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

const tierName = computed(() => tierNameByPlan[billing.subscription.plan])
const monthlyTotal = computed(
  () => tierPriceByPlan[billing.subscription.plan] * billableMemberCount
)

const planActionLabel = computed(() =>
  tier === 'team'
    ? t('prototype.views.settings.billing.changePlan')
    : t('prototype.views.settings.billing.upgradePlan')
)

const creditsRemaining = computed(() => billing.creditBalance.remaining)
const monthlyAllowance = computed(() => billing.creditBalance.monthlyAllowance)
const creditsUsed = computed(() =>
  Math.max(0, monthlyAllowance.value - creditsRemaining.value)
)
const usedPercent = computed(() =>
  monthlyAllowance.value > 0
    ? Math.min(
        100,
        Math.round((creditsUsed.value / monthlyAllowance.value) * 100)
      )
    : 0
)
const additionalCredits = computed(() => 0)

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

const helpLinks = computed(() => [
  {
    key: 'learn',
    icon: 'icon-[lucide--circle-help]',
    label: t('subscription.learnMore')
  },
  {
    key: 'partner',
    icon: 'icon-[lucide--circle-help]',
    label: t('prototype.views.settings.billing.partnerNodesPricing')
  },
  {
    key: 'support',
    icon: 'icon-[lucide--message-circle]',
    label: t('subscription.messageSupport')
  }
])

function fmt(value: number): string {
  return value.toLocaleString()
}

function formattedDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function onManageStub(
  _kind:
    | 'plan'
    | 'payment'
    | 'credits'
    | 'invoices'
    | 'more'
    | 'refresh'
    | 'help'
) {
  // Prototype stub — real flow would open a modal / Stripe portal.
}
</script>
