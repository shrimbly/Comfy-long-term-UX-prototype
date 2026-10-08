<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { adminFixture } from '../fixtures/admin'

const { t } = useI18n()
const detail = ref(true)
const deployment = adminFixture.deployments!.find(
  (item) => item.id === 'dep-acme-studio'
)!
const editorUrl = `/prototype/homestead?v=1&entry=deployment&environment=${deployment.id}`
const navigation = [
  { key: 'home', icon: 'icon-[lucide--house]' },
  { key: 'usage', icon: 'icon-[lucide--chart-no-axes-combined]' },
  { key: 'activity', icon: 'icon-[lucide--list]' },
  { key: 'assets', icon: 'icon-[lucide--images]' }
]
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <aside
      class="hidden w-60 shrink-0 flex-col border-r border-interface-stroke bg-secondary-background p-3 md:flex"
      :aria-label="t('homestead.deploymentScreen.navigation')"
    >
      <p class="px-2 py-3 font-medium">
        {{ t('homestead.deploymentScreen.platform') }}
      </p>
      <div class="mt-5 space-y-1">
        <div
          v-for="item in navigation"
          :key="item.key"
          class="flex items-center gap-3 px-3 py-3 text-muted-foreground"
        >
          <i :class="[item.icon, 'size-4']" aria-hidden="true" />
          {{ t(`homestead.deploymentScreen.${item.key}`) }}
        </div>
      </div>
      <p class="mt-6 px-3 py-2 text-xs text-muted-foreground">
        {{ t('homestead.deploymentScreen.api') }}
      </p>
      <Button variant="secondary" class="justify-start" @click="detail = false">
        <i class="icon-[lucide--zap] size-4" aria-hidden="true" />
        {{ t('homestead.deploymentScreen.deploy') }}
      </Button>
      <div
        class="mt-auto flex items-center gap-3 border-t border-interface-stroke px-3 pt-5 pb-2"
      >
        <i class="icon-[lucide--building-2] size-4" aria-hidden="true" />
        {{ t('homestead.deploymentScreen.workspace') }}
      </div>
    </aside>

    <main class="min-w-0 flex-1 overflow-y-auto p-5 sm:p-10 lg:px-14">
      <div class="mx-auto max-w-6xl">
        <template v-if="detail">
          <Button variant="muted-textonly" class="mb-7" @click="detail = false">
            <i class="icon-[lucide--arrow-left] size-4" aria-hidden="true" />
            {{ t('homestead.deploymentScreen.deployments') }}
          </Button>
          <header class="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 class="m-0 text-xl font-semibold">
                {{ deployment.name }} · {{ deployment.release }}
              </h1>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <span
                  class="inline-flex items-center gap-2 rounded-full bg-secondary-background px-2 py-1 text-xs"
                >
                  <span class="size-1.5 rounded-full bg-success-background" />
                  {{ t('homestead.deploymentScreen.ready') }}
                </span>
                <span class="font-mono text-xs text-muted-foreground">{{
                  deployment.id
                }}</span>
              </div>
            </div>
            <Button
              as="a"
              :href="editorUrl"
              variant="inverted"
              class="no-underline"
            >
              <i
                class="icon-[lucide--external-link] size-4"
                aria-hidden="true"
              />
              {{ t('homestead.deploymentScreen.openUi') }}
            </Button>
          </header>
          <div class="mt-8 border-b border-interface-stroke">
            <span class="inline-block border-b-2 border-base-foreground pb-3">{{
              t('homestead.deploymentScreen.overview')
            }}</span>
          </div>
          <div class="mt-7 grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr]">
            <section
              class="rounded-lg border border-interface-stroke bg-secondary-background p-5"
            >
              <h2 class="m-0 text-sm font-medium">
                {{ t('homestead.deploymentScreen.source') }}
              </h2>
              <dl class="mt-6 space-y-5">
                <div class="flex flex-wrap justify-between gap-2">
                  <dt class="text-muted-foreground">
                    {{ t('homestead.deploymentScreen.build') }}
                  </dt>
                  <dd class="m-0">{{ deployment.name }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-muted-foreground">
                    {{ t('homestead.deploymentScreen.release') }}
                  </dt>
                  <dd class="m-0">{{ deployment.release }}</dd>
                </div>
              </dl>
              <p class="mt-3 text-right text-xs text-muted-foreground">
                {{ t('homestead.deploymentScreen.latest') }}
              </p>
            </section>
            <section
              class="rounded-lg border border-interface-stroke bg-secondary-background p-5"
            >
              <h2 class="m-0 text-sm font-medium">
                {{ t('homestead.deploymentScreen.runtime') }}
              </h2>
              <dl class="mt-6 space-y-5">
                <div class="flex justify-between gap-2">
                  <dt class="text-muted-foreground">
                    {{ t('homestead.deploymentScreen.gpu') }}
                  </dt>
                  <dd class="m-0">{{ deployment.gpu }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-muted-foreground">
                    {{ t('homestead.deploymentScreen.region') }}
                  </dt>
                  <dd class="m-0">
                    {{ t('homestead.deploymentScreen.anywhere') }}
                  </dd>
                </div>
              </dl>
            </section>
            <div class="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <section
                v-for="worker in [
                  { key: 'activeWorkers', count: 0 },
                  { key: 'maxWorkers', count: 3 }
                ]"
                :key="worker.key"
                class="rounded-lg border border-interface-stroke bg-secondary-background p-5"
              >
                <h2
                  class="m-0 text-xs font-normal text-muted-foreground uppercase"
                >
                  {{ t(`homestead.deploymentScreen.${worker.key}`) }}
                </h2>
                <p class="mt-3 mb-0 text-3xl">{{ worker.count }}</p>
              </section>
            </div>
          </div>
          <section class="mt-7 border-t border-interface-stroke pt-6">
            <h2 class="m-0 text-sm font-medium">
              {{ t('homestead.deploymentScreen.contents') }}
            </h2>
            <p class="mt-3 text-muted-foreground">
              {{ t('homestead.deploymentScreen.contentsDescription') }}
            </p>
            <div class="mt-5 grid gap-6 sm:grid-cols-2">
              <div
                v-for="group in [
                  { key: 'customNodes', items: deployment.nodePacks },
                  { key: 'models', items: deployment.models }
                ]"
                :key="group.key"
              >
                <h3 class="text-xs font-normal text-muted-foreground uppercase">
                  {{ t(`homestead.deploymentScreen.${group.key}`) }}
                </h3>
                <ul class="mt-3! space-y-2">
                  <li
                    v-for="item in group.items"
                    :key="item"
                    class="font-mono text-xs"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </template>
        <template v-else>
          <h1 class="mb-7 text-xl font-semibold">
            {{ t('homestead.deploymentScreen.deployments') }}
          </h1>
          <div
            class="overflow-x-auto rounded-lg border border-interface-stroke"
          >
            <table class="w-full text-left">
              <thead
                class="bg-secondary-background text-xs text-muted-foreground"
              >
                <tr>
                  <th
                    v-for="key in ['deployment', 'status', 'compute']"
                    :key="key"
                    class="p-4 font-normal"
                  >
                    {{ t(`homestead.deploymentScreen.${key}`) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-4">
                    <Button variant="muted-textonly" @click="detail = true"
                      >{{ deployment.name }} · {{ deployment.release }}</Button
                    >
                  </td>
                  <td class="p-4">
                    {{ t('homestead.deploymentScreen.ready') }}
                  </td>
                  <td class="p-4">{{ deployment.gpu }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <footer
          class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-interface-stroke pt-5 text-xs text-muted-foreground"
        >
          <span>{{ t('homestead.deploymentScreen.prototype') }}</span>
          <Button
            as="a"
            href="/prototype/homestead?v=1"
            variant="muted-textonly"
            size="sm"
            >{{ t('homestead.deploymentScreen.fullExperience') }}
            <i class="icon-[lucide--arrow-right] size-3.5" aria-hidden="true"
          /></Button>
        </footer>
      </div>
    </main>
  </div>
</template>
