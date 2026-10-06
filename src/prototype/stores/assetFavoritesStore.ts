// Implements:
//   log: ../prototype/design-decisions.md (2026-10-07 — media library in
//        place, with a Favorites filter)
//
// Which media assets the viewer starred. In memory, like every prototype
// store, and seeded so the Favorites filter has something to show.

import { defineStore } from 'pinia'
import { ref } from 'vue'

const SEEDED = [
  'media-proj-cocacola-01.jpg',
  'media-proj-cocacola-hero_spin_00011.mp4',
  'media-proj-brand-02.jpg'
]

export const usePrototypeAssetFavoritesStore = defineStore(
  'prototype-asset-favorites',
  () => {
    const ids = ref(new Set(SEEDED))

    function isFavorite(id: string) {
      return ids.value.has(id)
    }

    function toggle(id: string) {
      const next = new Set(ids.value)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      ids.value = next
    }

    return { ids, isFavorite, toggle }
  }
)
