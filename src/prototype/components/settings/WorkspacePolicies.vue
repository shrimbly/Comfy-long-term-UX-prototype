<template>
  <Tabs v-model="kind" class="gap-6">
    <TabsList
      :aria-label="t('prototype.settings.policies.categories')"
      variant="bordered"
      class="justify-start border-b border-border-subtle"
    >
      <TabsTrigger
        variant="flush"
        class="border-b-2 border-solid border-transparent data-[state=active]:border-base-foreground"
        value="nodes"
        >{{ t('prototype.settings.policies.nodes')
        }}<span class="ml-2 text-xs text-muted-foreground">{{
          countAllowed('nodes')
        }}</span></TabsTrigger
      >
      <TabsTrigger
        variant="flush"
        class="border-b-2 border-solid border-transparent data-[state=active]:border-base-foreground"
        value="models"
        >{{ t('prototype.settings.policies.models')
        }}<span class="ml-2 text-xs text-muted-foreground">{{
          countAllowed('models')
        }}</span></TabsTrigger
      >
    </TabsList>
    <TabsContent :value="kind" class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="m-0 text-base font-medium">
              {{ t(`prototype.settings.policies.${kind}Heading`) }}
            </h3>
            <AccessibleTooltip
              :label="t('prototype.settings.policies.info')"
              trigger-class="grid size-7 place-items-center rounded-md"
              ><i class="icon-[lucide--info] size-4 text-muted-foreground"
            /></AccessibleTooltip>
          </div>
          <p class="mt-1 mb-0 text-sm text-muted-foreground">
            {{
              textT('prototype.settings.policies.scope', {
                workspace: personas.currentWorkspace?.name
              })
            }}
          </p>
        </div>
        <span
          class="rounded-full border border-border-subtle px-3 py-1.5 text-xs text-muted-foreground"
          >{{ t('prototype.settings.policies.allProjects') }}</span
        >
      </div>
      <div
        v-if="!store.canEdit"
        class="rounded-lg border border-border-subtle bg-secondary-background/30 p-3 text-sm text-muted-foreground"
      >
        {{ t('prototype.settings.policies.readOnly') }}
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-48 flex-1">
          <i
            class="pointer-events-none absolute top-3 left-3 icon-[lucide--search] size-4 text-muted-foreground"
          /><Input
            v-model="search"
            class="h-10 pl-9"
            :aria-label="t('prototype.settings.policies.search')"
            :placeholder="t('prototype.settings.policies.search')"
          />
        </div>
        <label
          class="flex h-10 items-center gap-2 rounded-lg border border-border-default px-3 text-sm text-muted-foreground"
          >{{ t('prototype.settings.policies.status')
          }}<select
            v-model="status"
            class="bg-transparent text-base-foreground outline-none"
            :aria-label="t('prototype.settings.policies.status')"
          >
            <option value="all">
              {{ t('prototype.settings.policies.all') }}
            </option>
            <option value="allowed">
              {{ t('prototype.settings.policies.allowed') }}
            </option>
            <option value="blocked">
              {{ t('prototype.settings.policies.blocked') }}
            </option>
          </select></label
        >
        <label
          class="flex h-10 items-center gap-2 rounded-lg border border-border-default px-3 text-sm text-muted-foreground"
          >{{ t('prototype.settings.policies.license')
          }}<select
            v-model="license"
            class="max-w-32 bg-transparent text-base-foreground outline-none"
            :aria-label="t('prototype.settings.policies.license')"
          >
            <option value="all">
              {{ t('prototype.settings.policies.all') }}
            </option>
            <option v-for="value in licenses" :key="value">{{ value }}</option>
          </select></label
        >
        <select
          v-model="sort"
          :aria-label="t('prototype.settings.policies.sort')"
          class="h-10 rounded-lg border border-border-default bg-transparent px-3 text-sm"
        >
          <option value="installs">
            {{ t('prototype.settings.policies.popular') }}
          </option>
          <option value="name">
            {{ t('prototype.settings.policies.nameSort') }}
          </option>
        </select>
      </div>
      <div class="overflow-hidden rounded-xl border border-border-subtle">
        <Table
          class="min-w-full [&_table]:min-w-3xl [&_td]:border-b [&_td]:border-border-subtle/50 [&_td]:px-4 [&_th]:px-4"
        >
          <TableHeader
            ><TableRow class="bg-secondary-background/60"
              ><TableHead class="w-1/3">{{
                t(`prototype.settings.policies.${kind}Name`)
              }}</TableHead
              ><TableHead>{{
                t('prototype.settings.policies.publisher')
              }}</TableHead
              ><TableHead class="w-24">{{
                t('prototype.settings.policies.installs')
              }}</TableHead
              ><TableHead class="w-24">{{
                t('prototype.settings.policies.version')
              }}</TableHead
              ><TableHead class="w-28">{{
                t('prototype.settings.policies.license')
              }}</TableHead
              ><TableHead class="w-32 text-right">{{
                t('prototype.settings.policies.allow')
              }}</TableHead></TableRow
            ></TableHeader
          >
          <TableBody>
            <TableRow
              v-for="item in pageItems"
              :key="item.id"
              class="h-14 hover:bg-secondary-background/30"
            >
              <TableCell class="font-medium"
                ><span class="block truncate" :title="item.name">{{
                  item.name
                }}</span></TableCell
              >
              <TableCell class="text-muted-foreground"
                ><span class="block truncate">{{
                  item.publisher
                }}</span></TableCell
              >
              <TableCell class="text-muted-foreground tabular-nums">{{
                item.installs ? compact.format(item.installs) : '—'
              }}</TableCell>
              <TableCell class="text-xs text-muted-foreground">{{
                item.version
              }}</TableCell>
              <TableCell class="text-xs text-muted-foreground">{{
                item.license
              }}</TableCell>
              <TableCell
                ><label
                  class="flex cursor-pointer items-center justify-end gap-3 py-2 text-xs"
                  ><span
                    :class="
                      cn(
                        store.isAllowed(item.id)
                          ? 'text-base-foreground'
                          : 'text-muted-foreground'
                      )
                    "
                    >{{
                      t(
                        store.isAllowed(item.id)
                          ? 'prototype.settings.policies.allowed'
                          : 'prototype.settings.policies.blocked'
                      )
                    }}</span
                  ><Checkbox
                    :model-value="store.isAllowed(item.id)"
                    :disabled="!store.canEdit"
                    :aria-label="
                      textT('prototype.settings.policies.allowItem', {
                        name: item.name
                      })
                    "
                    @update:model-value="
                      change(item.id, $event === true)
                    " /></label
              ></TableCell>
            </TableRow>
            <TableRow v-if="!filtered.length"
              ><TableCell
                :colspan="6"
                class="py-12 text-center text-muted-foreground"
                >{{ t('prototype.settings.policies.empty')
                }}<Button
                  variant="muted-textonly"
                  class="ml-2"
                  @click="clearFilters"
                  >{{ t('prototype.settings.policies.clear') }}</Button
                ></TableCell
              ></TableRow
            >
          </TableBody>
        </Table>
        <div
          class="flex items-center justify-between gap-4 border-t border-border-subtle px-4 py-3 text-xs text-muted-foreground"
        >
          <span
            >{{
              t('prototype.settings.policies.allowedCount', countAllowed(kind))
            }}
            ·
            {{
              t('prototype.settings.policies.results', filtered.length)
            }}</span
          >
          <div class="flex items-center gap-3">
            <Button
              variant="muted-textonly"
              size="icon-sm"
              :disabled="page === 1"
              :aria-label="t('prototype.settings.previous')"
              @click="page--"
              ><i class="icon-[lucide--chevron-left] size-4" /></Button
            ><span class="tabular-nums">{{ page }} / {{ pages }}</span
            ><Button
              variant="muted-textonly"
              size="icon-sm"
              :disabled="page >= pages"
              :aria-label="t('prototype.settings.next')"
              @click="page++"
              ><i class="icon-[lucide--chevron-right] size-4"
            /></Button>
          </div>
        </div>
      </div>
      <div
        class="flex min-h-9 items-center justify-between gap-4 text-xs text-muted-foreground"
      >
        <span>{{ t('prototype.settings.policies.builtIn') }}</span
        ><span class="flex items-center gap-2"
          ><i class="icon-[lucide--flask-conical] size-3.5" />{{
            t('prototype.settings.sampleCatalog')
          }}</span
        >
      </div>
      <div
        v-if="lastChange"
        role="status"
        class="flex items-center justify-between rounded-lg border border-border-subtle bg-secondary-background/40 px-4 py-2 text-sm"
      >
        <span>{{ t('prototype.settings.policies.saved') }}</span
        ><Button variant="muted-textonly" @click="undo">{{
          t('prototype.settings.undo')
        }}</Button>
      </div>
    </TabsContent>
  </Tabs>
</template>
<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Input from '@/components/ui/input/Input.vue'
import AccessibleTooltip from '@/components/ui/tooltip/AccessibleTooltip.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import Table from '@/components/ui/table/Table.vue'
import TableHeader from '@/components/ui/table/TableHeader.vue'
import TableHead from '@/components/ui/table/TableHead.vue'
import TableBody from '@/components/ui/table/TableBody.vue'
import TableRow from '@/components/ui/table/TableRow.vue'
import TableCell from '@/components/ui/table/TableCell.vue'
import { useTextT } from '../../composables/useTextT'
import { policyCatalog } from '../../fixtures/policyCatalog'
import { usePrototypePolicyStore } from '../../stores/policyStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
const { t } = useI18n()
const textT = useTextT()
const store = usePrototypePolicyStore()
const personas = usePrototypePersonaStore()
const kind = ref('nodes')
const search = ref('')
const status = ref('all')
const license = ref('all')
const sort = ref('installs')
const page = ref(1)
const lastChange = ref<{ id: string; allowed: boolean } | null>(null)
const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
})
const licenses = computed(() =>
  [
    ...new Set(
      policyCatalog
        .filter((item) => item.kind === kind.value)
        .map((item) => item.license)
    )
  ].sort()
)
const filtered = computed(() =>
  policyCatalog
    .filter(
      (item) =>
        item.kind === kind.value &&
        `${item.name} ${item.publisher}`
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()) &&
        (license.value === 'all' || item.license === license.value) &&
        (status.value === 'all' ||
          store.isAllowed(item.id) === (status.value === 'allowed'))
    )
    .sort((a, b) =>
      sort.value === 'name'
        ? a.name.localeCompare(b.name)
        : b.installs - a.installs
    )
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 8)))
const pageItems = computed(() =>
  filtered.value.slice((page.value - 1) * 8, page.value * 8)
)
watch([search, status, license, sort, kind], () => {
  page.value = 1
})
watch(pages, (total) => {
  page.value = Math.min(page.value, total)
})
watch(kind, clearFilters)
function countAllowed(category: string) {
  return policyCatalog.filter(
    (item) => item.kind === category && store.isAllowed(item.id)
  ).length
}
function clearFilters() {
  search.value = ''
  status.value = 'all'
  license.value = 'all'
}
function change(id: string, allowed: boolean) {
  const previous = store.isAllowed(id)
  if (store.setAllowed(id, allowed))
    lastChange.value = { id, allowed: previous }
}
function undo() {
  if (!lastChange.value) return
  store.setAllowed(lastChange.value.id, lastChange.value.allowed)
  lastChange.value = null
}
</script>
