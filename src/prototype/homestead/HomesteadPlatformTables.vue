<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import type { Deployment } from '../types'

const { deployments } = defineProps<{ deployments: Deployment[] }>()
const { t } = useI18n()
const search = ref('')
const sort = ref('name')
const { copy, copied, text } = useClipboard()
const filteredBuilds = computed(() =>
  deployments
    .filter((item) =>
      item.name.toLowerCase().includes(search.value.toLowerCase())
    )
    .sort((a, b) =>
      sort.value === 'name'
        ? a.name.localeCompare(b.name)
        : (b.release ?? '').localeCompare(a.release ?? '', undefined, {
            numeric: true
          })
    )
)
const base = '/prototype/homestead/deployment'
function editorUrl(id: string) {
  return `/prototype/homestead?v=1&entry=deployment&environment=${id}`
}
function endpoint(id: string) {
  return `https://${id}.run.comfy.app`
}
</script>

<template>
  <header>
    <h1 class="m-0 text-2xl font-semibold">
      {{ t('homestead.deploymentScreen.deploy') }}
    </h1>
    <p class="mt-3 text-muted-foreground">
      {{ t('homestead.deploymentScreen.deployDescription') }}
    </p>
  </header>
  <section
    id="builds"
    class="mt-9"
    :aria-label="t('homestead.deploymentScreen.builds')"
  >
    <h2 class="m-0 text-lg font-medium">
      {{ t('homestead.deploymentScreen.builds') }}
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">
      {{ t('homestead.deploymentScreen.buildsDescription') }}
    </p>
    <div class="my-5 flex flex-wrap gap-3">
      <label
        class="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-interface-stroke px-3"
      >
        <i
          class="icon-[lucide--search] size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          v-model="search"
          :aria-label="t('homestead.deploymentScreen.search')"
          :placeholder="t('homestead.deploymentScreen.search')"
          class="h-9 w-full bg-transparent text-sm outline-none"
        />
      </label>
      <select
        v-model="sort"
        :aria-label="t('homestead.deploymentScreen.sort')"
        class="h-9 rounded-lg border! border-interface-stroke! px-3! text-sm focus-visible:outline-2 focus-visible:outline-primary-background"
      >
        <option value="name">
          {{ t('homestead.deploymentScreen.nameSort') }}
        </option>
        <option value="release">
          {{ t('homestead.deploymentScreen.releaseSort') }}
        </option>
      </select>
    </div>
    <div class="overflow-x-auto rounded-lg border border-interface-stroke">
      <table
        class="w-full border-collapse text-left text-sm"
        :aria-label="t('homestead.deploymentScreen.builds')"
      >
        <thead
          class="bg-secondary-background text-xs text-muted-foreground uppercase"
        >
          <tr>
            <th
              v-for="key in [
                'build',
                'latestRelease',
                'contents',
                'deployments',
                'edited'
              ]"
              :key="key"
              class="px-4 py-3 font-normal whitespace-nowrap"
            >
              {{ t(`homestead.deploymentScreen.${key}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="build in filteredBuilds"
            :key="build.id"
            class="border-t border-interface-stroke hover:bg-secondary-background/50"
          >
            <td class="px-4 py-4">
              <RouterLink
                :to="{ path: base, query: { build: build.id } }"
                class="font-medium whitespace-nowrap text-base-foreground no-underline hover:underline"
                >{{ build.name }}</RouterLink
              >
            </td>
            <td class="px-4 py-4">
              <span class="flex items-center gap-2 whitespace-nowrap"
                ><span class="size-1.5 rounded-full bg-success-background" />{{
                  build.release
                }}</span
              ><span class="mt-1 block text-xs text-muted-foreground">{{
                t('homestead.deploymentScreen.readyToDeploy')
              }}</span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-muted-foreground">
              {{
                t('homestead.deploymentScreen.contentCount', {
                  models: build.models.length,
                  nodes: t(
                    'homestead.deploymentScreen.nodeCount',
                    { count: build.nodePacks.length },
                    build.nodePacks.length
                  )
                })
              }}
            </td>
            <td class="px-4 py-4">
              <RouterLink
                :to="`${base}/${build.id}`"
                class="text-base-foreground no-underline hover:underline"
                >{{
                  t('homestead.deploymentScreen.oneDeployment')
                }}
                ↗</RouterLink
              >
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-muted-foreground">
              {{ t('homestead.deploymentScreen.demoDate') }}
            </td>
          </tr>
          <tr v-if="!filteredBuilds.length">
            <td colspan="5" class="p-8 text-center text-muted-foreground">
              {{ t('homestead.deploymentScreen.noBuilds') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section
    id="deployments"
    class="mt-10"
    :aria-label="t('homestead.deploymentScreen.deployments')"
  >
    <h2 class="m-0 text-lg font-medium">
      {{ t('homestead.deploymentScreen.deployments') }}
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">
      {{ t('homestead.deploymentScreen.deploymentsDescription') }}
    </p>
    <div class="mt-5 overflow-x-auto rounded-lg border border-interface-stroke">
      <table
        class="w-full min-w-240 border-collapse text-left text-xs"
        :aria-label="t('homestead.deploymentScreen.deployments')"
      >
        <thead class="bg-secondary-background text-muted-foreground uppercase">
          <tr>
            <th
              v-for="key in [
                'deployment',
                'endpoint',
                'status',
                'source',
                'compute',
                'workers',
                'spend'
              ]"
              :key="key"
              class="px-4 py-3 font-normal whitespace-nowrap"
            >
              {{ t(`homestead.deploymentScreen.${key}`) }}
            </th>
            <th
              class="sticky right-0 bg-secondary-background px-4 py-3 font-normal whitespace-nowrap"
              :title="t('homestead.deploymentScreen.openUiHint')"
            >
              {{ t('homestead.deploymentScreen.openUi') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="deployment in deployments"
            :key="deployment.id"
            class="border-t border-interface-stroke hover:bg-secondary-background/50"
          >
            <td class="px-4 py-4">
              <RouterLink
                :to="`${base}/${deployment.id}`"
                class="font-medium whitespace-nowrap text-base-foreground no-underline hover:underline"
                >{{ deployment.id }}</RouterLink
              >
            </td>
            <td class="px-4 py-4">
              <Button
                variant="muted-textonly"
                size="sm"
                :aria-label="t('homestead.deploymentScreen.copyUrl')"
                @click="copy(endpoint(deployment.id))"
                ><span class="max-w-36 truncate font-mono text-xs">{{
                  copied && text === endpoint(deployment.id)
                    ? t('homestead.deploymentScreen.copied')
                    : `${deployment.id}.run.comfy.app`
                }}</span
                ><i class="icon-[lucide--copy] size-3 shrink-0"
              /></Button>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
              <span class="inline-flex items-center gap-2"
                ><span
                  :class="[
                    'size-1.5 rounded-full',
                    deployment.status === 'asleep'
                      ? 'bg-muted-foreground'
                      : 'bg-success-background'
                  ]"
                />{{
                  t(
                    deployment.status === 'asleep'
                      ? 'homestead.deploymentScreen.scaledToZero'
                      : 'homestead.deploymentScreen.ready'
                  )
                }}</span
              >
            </td>
            <td class="px-4 py-4">
              <RouterLink
                :to="{ path: base, query: { build: deployment.id } }"
                class="text-base-foreground no-underline hover:underline"
                >{{ deployment.name }} · {{ deployment.release }}</RouterLink
              >
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
              {{ deployment.gpu
              }}<span class="mt-1 block text-muted-foreground">{{
                t('homestead.deploymentScreen.anywhere')
              }}</span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">0–3</td>
            <td class="px-4 py-4">0</td>
            <td class="sticky right-0 bg-base-background px-4 py-4">
              <Button
                as="a"
                :href="editorUrl(deployment.id)"
                variant="secondary"
                size="sm"
                class="whitespace-nowrap no-underline"
                >{{ t('homestead.deploymentScreen.openUi')
                }}<i class="icon-[lucide--external-link] size-3"
              /></Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
