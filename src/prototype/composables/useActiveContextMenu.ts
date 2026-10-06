// Single-active-menu coordinator for the prototype's right-click menus.
//
// Cards and folders open their context menu on `@contextmenu.prevent.stop`, so
// the native event never reaches PrimeVue's outside-click dismissal — without
// coordination, right-clicking a second item leaves the first menu on screen.
// Every menu wrapper registers its `hide` when it opens and clears it when it
// closes; opening any menu first dismisses whichever menu was previously open,
// regardless of which component owns it (workflow card, folder, project card,
// or the bulk-selection menu).
let closeActive: (() => void) | null = null

export function useActiveContextMenu() {
  function activate(hide: () => void) {
    if (closeActive && closeActive !== hide) closeActive()
    closeActive = hide
  }
  function deactivate(hide: () => void) {
    if (closeActive === hide) closeActive = null
  }
  return { activate, deactivate }
}
