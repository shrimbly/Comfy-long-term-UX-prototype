<template>
  <div class="asset-detail-panel">
    <div
      :class="[
        'thumbnail-stage',
        isSingle ? 'thumbnail-stage--single' : 'thumbnail-stage--multi'
      ]"
    >
      <img
        v-if="isSingle && fannedThumbnails[0]"
        :src="fannedThumbnails[0]"
        alt=""
        class="single-thumb rounded-lg ring-2 ring-base-background"
      />
      <div v-else-if="!isSingle" class="card-stack">
        <img
          v-if="fannedThumbnails[2]"
          :src="fannedThumbnails[2]"
          alt=""
          class="fan-back rounded-lg ring-2 ring-base-background"
        />
        <img
          v-if="fannedThumbnails[1]"
          :src="fannedThumbnails[1]"
          alt=""
          class="fan-mid rounded-lg ring-2 ring-base-background"
        />
        <img
          v-if="fannedThumbnails[0]"
          :src="fannedThumbnails[0]"
          alt=""
          class="fan-front rounded-lg ring-2 ring-base-background"
        />
      </div>
    </div>

    <div v-if="isSingle" class="detail-section">
      <div class="detail-rows">
        <div class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.name') }}
          </span>
          <span class="detail-value" :title="displayName">
            {{ displayName }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.type') }}
          </span>
          <span class="detail-value">{{ fileType }}</span>
        </div>
        <div v-if="dimensions" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.dimensions') }}
          </span>
          <span class="detail-value">{{ dimensions }}</span>
        </div>
        <div v-if="singleAsset?.size" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.size') }}
          </span>
          <span class="detail-value">{{ formattedSize }}</span>
        </div>
        <div v-if="projectName" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.project') }}
          </span>
          <span class="detail-value" :title="projectName">
            {{ projectName }}
          </span>
        </div>
        <div v-if="workflowName" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.workflow') }}
          </span>
          <span class="detail-value" :title="workflowName">
            {{ workflowName }}
          </span>
        </div>
        <div v-if="storage" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.storage') }}
          </span>
          <span class="detail-value inline-flex items-center gap-1.5">
            <i
              :class="
                storage === 'cloud'
                  ? 'icon-[lucide--cloud] size-3.5'
                  : 'icon-[lucide--hard-drive] size-3.5'
              "
            />
            {{
              storage === 'cloud'
                ? $t('mediaAsset.storage.cloud')
                : $t('mediaAsset.storage.local')
            }}
          </span>
        </div>
        <div v-if="installAttribution" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.generatedBy') }}
          </span>
          <span class="detail-value inline-flex items-center gap-1.5">
            <i class="icon-[lucide--monitor] size-3.5" />
            <span :title="installAttribution.installId">
              {{ installAttributionLine }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <div v-else class="detail-section">
      <div class="detail-rows">
        <div class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.items') }}
          </span>
          <span class="detail-value">{{ assets.length }}</span>
        </div>
        <div v-if="totalSize > 0" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.totalSize') }}
          </span>
          <span class="detail-value">{{ formattedTotalSize }}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        {{
          isSingle
            ? $t('mediaAsset.details.tags')
            : $t('mediaAsset.details.sharedTags')
        }}
      </h4>
      <AssetTagsEditor :assets="assets" />
    </div>

    <div v-if="isSingle && hasGenerationDetails" class="detail-section">
      <h4 class="detail-section-title">
        {{ $t('mediaAsset.details.generationDetails') }}
      </h4>
      <div class="detail-rows">
        <div v-if="formattedDuration" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.duration') }}
          </span>
          <span class="detail-value">{{ formattedDuration }}</span>
        </div>
        <div v-if="promptMetadata?.model" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.model') }}
          </span>
          <span class="detail-value" :title="promptMetadata.model">
            {{ promptMetadata.model }}
          </span>
        </div>
        <div v-if="promptMetadata?.lora" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.lora') }}
          </span>
          <span class="detail-value" :title="promptMetadata.lora">
            {{ promptMetadata.lora }}
          </span>
        </div>
        <div v-if="promptMetadata?.vae" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.vae') }}
          </span>
          <span class="detail-value" :title="promptMetadata.vae">
            {{ promptMetadata.vae }}
          </span>
        </div>
        <div v-if="promptMetadata?.steps != null" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.steps') }}
          </span>
          <span class="detail-value">{{ promptMetadata.steps }}</span>
        </div>
        <div v-if="promptMetadata?.seed != null" class="detail-row">
          <span class="detail-label">
            {{ $t('mediaAsset.details.seed') }}
          </span>
          <span class="detail-value">{{ promptMetadata.seed }}</span>
        </div>
      </div>
      <div v-if="promptMetadata?.prompt" class="prompt-block">
        <span class="detail-label">
          {{ $t('mediaAsset.details.prompt') }}
        </span>
        <p class="prompt-text">{{ promptMetadata.prompt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetTagsEditor from '@/platform/assets/components/AssetTagsEditor.vue'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { getAssetDisplayName } from '@/platform/assets/utils/assetMetadataUtils'
import type { PromptMetadata } from '@/platform/assets/utils/promptMetadataParser'
import { formatSize, getMediaTypeFromFilename } from '@/utils/formatUtil'

const { assets, promptMetadata = null } = defineProps<{
  assets: readonly AssetItem[]
  promptMetadata?: PromptMetadata | null
}>()

const { t } = useI18n()

const isSingle = computed(() => assets.length === 1)
const singleAsset = computed<AssetItem | null>(() =>
  isSingle.value ? assets[0] : null
)

const thumbnails = computed(() =>
  assets.map((a) => a.preview_url).filter((url): url is string => Boolean(url))
)
const fannedThumbnails = computed(() => thumbnails.value.slice(0, 3))

const displayName = computed(() =>
  singleAsset.value ? getAssetDisplayName(singleAsset.value) : ''
)

const fileType = computed(() => {
  if (!singleAsset.value) return ''
  const mediaType = getMediaTypeFromFilename(singleAsset.value.name)
  return mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
})

// Prototype-only metadata fields, sourced from user_metadata. Hidden in
// real-app contexts where these keys aren't set.
const projectName = computed(() => {
  const raw = singleAsset.value?.user_metadata?.projectName
  return typeof raw === 'string' ? raw : undefined
})
const workflowName = computed(() => {
  const raw = singleAsset.value?.user_metadata?.workflowName
  return typeof raw === 'string' ? raw : undefined
})
const storage = computed<'local' | 'cloud' | undefined>(() => {
  const raw = singleAsset.value?.user_metadata?.storage
  return raw === 'local' || raw === 'cloud' ? raw : undefined
})

// Install attribution per ../IA_Plan/wiki/entities/output.md
// §"Install attribution". Prototype-only: imported / pre-attribution
// assets carry no installAttribution and the row is hidden.
interface InstallAttribution {
  installId: string
  displayName: string
  comfyUIVersion: string
}
const installAttribution = computed<InstallAttribution | undefined>(() => {
  const raw = singleAsset.value?.user_metadata?.installAttribution
  if (!raw || typeof raw !== 'object') return undefined
  const candidate = raw as Partial<InstallAttribution>
  if (
    typeof candidate.installId !== 'string' ||
    typeof candidate.displayName !== 'string' ||
    typeof candidate.comfyUIVersion !== 'string'
  )
    return undefined
  return candidate as InstallAttribution
})

const installAttributionLine = computed(() => {
  const a = installAttribution.value
  if (!a) return ''
  return t('mediaAsset.details.installAttribution', {
    name: a.displayName,
    version: a.comfyUIVersion
  })
})

const dimensions = ref<string | null>(null)

watch(
  () => singleAsset.value?.id,
  () => {
    dimensions.value = null
    const asset = singleAsset.value
    if (!asset) return
    const mediaType = getMediaTypeFromFilename(asset.name)
    if (mediaType === 'image' && asset.preview_url) {
      const img = new Image()
      img.onload = () => {
        dimensions.value = `${img.naturalWidth} × ${img.naturalHeight}`
      }
      img.src = asset.preview_url
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  dimensions.value = null
})

const formattedSize = computed(() =>
  singleAsset.value ? formatSize(singleAsset.value.size) : ''
)

const totalSize = computed(() =>
  assets.reduce((sum, a) => sum + (a.size ?? 0), 0)
)
const formattedTotalSize = computed(() => formatSize(totalSize.value))

const executionTime = computed(
  () =>
    singleAsset.value?.user_metadata?.executionTimeInSeconds as
      | number
      | undefined
)

const formattedDuration = computed(() => {
  if (executionTime.value == null) return null
  return `${executionTime.value.toFixed(2)}s`
})

const hasGenerationDetails = computed(
  () =>
    formattedDuration.value !== null ||
    promptMetadata?.model != null ||
    promptMetadata?.lora != null ||
    promptMetadata?.vae != null ||
    promptMetadata?.steps != null ||
    promptMetadata?.seed != null ||
    promptMetadata?.prompt != null
)
</script>

<style scoped>
.asset-detail-panel {
  display: flex;
  flex-direction: column;
}

.thumbnail-stage {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-stage--single {
  align-items: center;
  padding: 0.75rem 1rem;
}

.thumbnail-stage--multi {
  align-items: flex-end;
  padding: 2.5rem 1.75rem 0.75rem 0.75rem;
}

.single-thumb {
  display: block;
  max-width: 100%;
  max-height: 10rem;
  width: auto;
  height: auto;
  object-fit: contain;
}

.card-stack {
  position: relative;
  flex: 0 0 auto;
}

.fan-front {
  position: relative;
  display: block;
  max-width: 10rem;
  max-height: 10rem;
  width: auto;
  height: auto;
  object-fit: contain;
  z-index: 20;
}

.fan-mid,
.fan-back {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: bottom left;
}

.fan-mid {
  z-index: 10;
  transform: translate(0.875rem, -1.25rem) rotate(6deg);
}

.fan-back {
  z-index: 0;
  transform: translate(1.75rem, -2.5rem) rotate(12deg);
}

.detail-section {
  padding: 0.75rem;
}

.detail-section + .detail-section {
  border-top: 1px solid var(--p-content-border-color);
}

.detail-section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-muted-color);
  margin: 0 0 0.75rem;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.6875rem;
  line-height: 1.4;
}

.detail-label {
  color: var(--p-text-muted-color);
  flex-shrink: 0;
}

.detail-value {
  color: var(--p-text-color);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.prompt-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  line-height: 1.4;
}

.prompt-text {
  margin: 0;
  color: var(--p-text-color);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 8rem;
  overflow-y: auto;
}
</style>
