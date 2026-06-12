// Mutable working copy of a local user's referenced media. NON-FINAL —
//   open-q:  ../IA_Plan/wiki/open-questions.md#local-media-as-references
//   log:     ../IA_Plan/wiki/prototype-log.md — Flow 03
//   concept: ../IA_Plan/wiki/concepts/local-dashboard-views.md
//
// The persona fixture is the seed; this store owns the live link state so
// the relink / add / remove flows have something to mutate. Referenced
// media is local-only — Comfy stores a pointer, never the bytes — so there
// is no project gate and no permission surface (cloud-only-permissions).

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { usePrototypePersonaStore } from './personaStore'
import type { LibraryAsset } from '../types'

export function parentFolder(path: string): string {
  const i = path.lastIndexOf('/')
  return i <= 0 ? path : path.slice(0, i)
}

function fileName(path: string): string {
  const i = path.lastIndexOf('/')
  return i < 0 ? path : path.slice(i + 1)
}

function folderLabel(dir: string): string {
  return fileName(dir)
}

// Deterministic simulated "found it here" path for the relink picker —
// stands in for an OS file chooser the prototype can't open.
export function relocatedPathFor(asset: LibraryAsset): string {
  const old = asset.sourcePath ?? ''
  return `/Volumes/Archive/${folderLabel(parentFolder(old))}/${fileName(old)}`
}

// Cached-thumbnail stand-ins for files added during the session.
const ADDED_PREVIEW_POOL = [
  '/prototype-fixtures/media/marketing-q3/02.jpg',
  '/prototype-fixtures/media/personal/03.jpg',
  '/prototype-fixtures/media/client-x-pitch/05.jpg'
]

function cloneReferences(assets: LibraryAsset[]): LibraryAsset[] {
  return assets
    .filter((a) => a.origin === 'referenced')
    .map((a) => ({ ...a, tags: a.tags ? [...a.tags] : undefined }))
}

export const useMediaReferenceStore = defineStore(
  'prototype-media-refs',
  () => {
    const personaStore = usePrototypePersonaStore()

    const references = ref<LibraryAsset[]>(
      cloneReferences(personaStore.fixture.libraryAssets)
    )

    function reseed() {
      references.value = cloneReferences(personaStore.fixture.libraryAssets)
    }

    watch(() => personaStore.currentPersonaId, reseed)
    watch(() => personaStore.fixture.currentWorkspaceId, reseed)

    const missingCount = computed(
      () => references.value.filter((a) => a.linkState === 'missing').length
    )

    // Other still-missing files sharing the given file's folder — drives the
    // "also relink N siblings" offer in the relink dialog.
    function missingSiblingCount(asset: LibraryAsset): number {
      if (!asset.sourcePath) return 0
      const folder = parentFolder(asset.sourcePath)
      return references.value.filter(
        (a) =>
          a.id !== asset.id &&
          a.linkState === 'missing' &&
          a.sourcePath !== undefined &&
          parentFolder(a.sourcePath) === folder
      ).length
    }

    function relink(id: string, newPath: string) {
      references.value = references.value.map((a) =>
        a.id === id
          ? {
              ...a,
              sourcePath: newPath,
              folder: folderLabel(parentFolder(newPath)),
              linkState: 'linked'
            }
          : a
      )
    }

    function relinkSiblings(oldFolder: string, newFolder: string) {
      references.value = references.value.map((a) => {
        if (a.linkState !== 'missing' || !a.sourcePath) return a
        if (parentFolder(a.sourcePath) !== oldFolder) return a
        const next = `${newFolder}/${fileName(a.sourcePath)}`
        return {
          ...a,
          sourcePath: next,
          folder: folderLabel(newFolder),
          linkState: 'linked'
        }
      })
    }

    function removeFromComfy(id: string) {
      references.value = references.value.filter((a) => a.id !== id)
    }

    function addReference(path: string, tags: string[] = []) {
      const id = `ref-${path}`
      if (references.value.some((a) => a.id === id)) return
      const preview =
        ADDED_PREVIEW_POOL[references.value.length % ADDED_PREVIEW_POOL.length]
      const asset: LibraryAsset = {
        id,
        name: fileName(path),
        section: 'media',
        origin: 'referenced',
        storage: 'local',
        linkState: 'linked',
        sourcePath: path,
        folder: folderLabel(parentFolder(path)),
        contentHash: `sha-${fileName(path)}`,
        previewUrl: preview,
        tags,
        updatedAt: new Date().toISOString()
      }
      references.value = [asset, ...references.value]
    }

    // Dev affordances — simulate the original moving/being deleted so the
    // missing → relink flow is demoable without a real filesystem.
    function simulateMissing(id: string) {
      references.value = references.value.map((a) =>
        a.id === id ? { ...a, linkState: 'missing' } : a
      )
    }

    function simulateFolderMissing(folderPath: string) {
      references.value = references.value.map((a) =>
        a.sourcePath && parentFolder(a.sourcePath) === folderPath
          ? { ...a, linkState: 'missing' }
          : a
      )
    }

    // The parent folder of the first linked file — the dev "simulate folder
    // moved" control breaks this whole folder to demo batch relink.
    const firstLinkedFolder = computed(() => {
      const first = references.value.find(
        (a) => a.linkState !== 'missing' && a.sourcePath
      )
      return first?.sourcePath ? parentFolder(first.sourcePath) : null
    })

    return {
      references,
      missingCount,
      firstLinkedFolder,
      missingSiblingCount,
      relink,
      relinkSiblings,
      removeFromComfy,
      addReference,
      simulateMissing,
      simulateFolderMissing
    }
  }
)
