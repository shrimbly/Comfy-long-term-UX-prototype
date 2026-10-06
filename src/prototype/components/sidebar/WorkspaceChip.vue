<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <Button
        variant="muted-textonly"
        size="unset"
        :class="
          cn(
            'gap-3 rounded-lg p-2 text-left',
            compact ? 'm-1 size-10 justify-center' : 'mt-2 w-full justify-start'
          )
        "
        :title="compact ? workspace.name : undefined"
        :aria-label="t('prototype.settings.workspaceMenu')"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold text-button-surface-contrast"
          :style="{ backgroundColor: workspace.avatarColor }"
          >{{ workspace.name.charAt(0) }}</span
        >
        <span
          v-if="!compact"
          class="min-w-0 flex-1 truncate text-sm font-medium"
          >{{ workspace.name }}</span
        >
        <i
          v-if="!compact"
          class="icon-[lucide--ellipsis] size-4 shrink-0 text-muted-foreground"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="compact ? 'right' : 'top'"
        :align="compact ? 'end' : 'start'"
        :side-offset="8"
        class="z-100 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border-default bg-interface-menu-surface p-2 text-sm text-base-foreground shadow-xl"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            :class="cn(itemClass, 'mb-2 h-auto gap-3 py-3')"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-lg font-semibold text-button-surface-contrast"
              :style="{ backgroundColor: workspace.avatarColor }"
              >{{ workspace.name.charAt(0) }}</span
            >
            <span class="flex min-w-0 flex-1 flex-col gap-1"
              ><span class="truncate font-medium">{{ workspace.name }}</span
              ><span class="text-xs text-muted-foreground">{{
                subtitle
              }}</span></span
            >
            <i class="icon-[lucide--arrow-right-left] size-4" />
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent
              :side-offset="8"
              class="z-100 w-72 rounded-xl border border-border-default bg-interface-menu-surface p-2 text-sm text-base-foreground shadow-xl"
            >
              <DropdownMenuItem
                v-for="ws in workspaces"
                :key="ws.id"
                :class="cn(itemClass, 'h-14')"
                @select="emit('selectWorkspace', ws.id)"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-md font-medium text-button-surface-contrast"
                  :style="{ backgroundColor: ws.avatarColor }"
                  >{{ ws.name.charAt(0) }}</span
                >
                <span class="min-w-0 flex-1 truncate">{{ ws.name }}</span>
                <i
                  v-if="ws.id === workspace.id"
                  class="icon-[lucide--check] size-4"
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-2 h-px bg-border-subtle" />
              <DropdownMenuItem :class="itemClass" @select="showPreviewNotice"
                ><i class="icon-[lucide--plus] size-4" />{{
                  t('prototype.sidebar.createWorkspace')
                }}</DropdownMenuItem
              >
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem :class="itemClass" @select="openSettings('general')"
          ><i class="icon-[lucide--settings] size-4" />{{
            t('prototype.settings.workspaceSettings')
          }}</DropdownMenuItem
        >
        <DropdownMenuItem
          v-if="workspace.currentUserRole === 'admin'"
          :class="itemClass"
          @select="openSettings('billing')"
          ><i class="icon-[lucide--credit-card] size-4" />{{
            t('prototype.settings.managePlan')
          }}</DropdownMenuItem
        >
        <DropdownMenuSeparator class="my-2 h-px bg-border-subtle" />
        <DropdownMenuLabel
          class="block truncate px-3 py-3 text-muted-foreground"
          >{{ currentUser.email }}</DropdownMenuLabel
        >
        <DropdownMenuItem :class="itemClass" @select="openSettings('account')"
          ><i class="icon-[lucide--user-round] size-4" />{{
            t('prototype.settings.accountSettings')
          }}</DropdownMenuItem
        >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger :class="itemClass"
            ><i class="icon-[lucide--globe] size-4" />{{
              t('prototype.settings.language')
            }}<i class="ml-auto icon-[lucide--chevron-right] size-4"
          /></DropdownMenuSubTrigger>
          <DropdownMenuPortal
            ><DropdownMenuSubContent
              :side-offset="8"
              class="z-100 w-44 rounded-lg border border-border-default bg-interface-menu-surface p-2 text-sm text-base-foreground shadow-xl"
            >
              <DropdownMenuItem
                v-for="language in languages"
                :key="language.id"
                :class="itemClass"
                @select="locale = language.id"
                >{{ language.label
                }}<i
                  v-if="locale === language.id"
                  class="ml-auto icon-[lucide--check] size-4"
              /></DropdownMenuItem> </DropdownMenuSubContent
          ></DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem :class="itemClass" @select="showPreviewNotice"
          ><i class="icon-[lucide--log-out] size-4" />{{
            t('prototype.settings.logOut')
          }}</DropdownMenuItem
        >
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from 'reka-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToastStore } from '@/platform/updates/common/toastStore'
import Button from '@/components/ui/button/Button.vue'
import type { SettingsPage } from '../../stores/uiStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import type { User, Workspace } from '../../types'

const {
  workspace,
  workspaces,
  currentUser,
  compact = false
} = defineProps<{
  workspace: Workspace
  workspaces: Workspace[]
  currentUser: User
  compact?: boolean
}>()
const emit = defineEmits<{
  selectWorkspace: [workspaceId: string]
  openSettings: []
}>()
const { t, locale } = useI18n()
const ui = usePrototypeUiStore()
const toast = useToastStore()
const itemClass =
  'flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 outline-none data-highlighted:bg-secondary-background-hover'
const subtitle = computed(
  () =>
    `${t(`prototype.sidebar.plan.${workspace.plan}`)} · ${t(`prototype.sidebar.role.${workspace.ownerUserId === currentUser.id ? 'owner' : workspace.currentUserRole}`)}`
)
const languages = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'ja', label: '日本語' }
]
function openSettings(page: SettingsPage) {
  ui.openSettings(page)
  emit('openSettings')
}
function showPreviewNotice() {
  toast.add({
    severity: 'info',
    summary: t('prototype.settings.previewAction'),
    life: 3500
  })
}
</script>
