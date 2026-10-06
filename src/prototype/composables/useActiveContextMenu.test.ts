import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useActiveContextMenu } from './useActiveContextMenu'

// The coordinator keeps a single module-scoped "active menu"; reset it to null
// between tests so each starts from a clean slate.
beforeEach(() => {
  const { activate, deactivate } = useActiveContextMenu()
  const reset = () => {}
  activate(reset)
  deactivate(reset)
})

describe('useActiveContextMenu', () => {
  it('dismisses the previously open menu when another opens', () => {
    const { activate } = useActiveContextMenu()
    const hideA = vi.fn()
    const hideB = vi.fn()

    activate(hideA)
    expect(hideA).not.toHaveBeenCalled()

    activate(hideB)
    expect(hideA).toHaveBeenCalledTimes(1)
    expect(hideB).not.toHaveBeenCalled()
  })

  it('does not close a menu re-activated while already active', () => {
    const { activate } = useActiveContextMenu()
    const hide = vi.fn()

    activate(hide)
    activate(hide)
    expect(hide).not.toHaveBeenCalled()
  })

  it('clears tracking on hide so a later open leaves the closed menu alone', () => {
    const { activate, deactivate } = useActiveContextMenu()
    const hideA = vi.fn()
    const hideB = vi.fn()

    activate(hideA)
    deactivate(hideA)

    activate(hideB)
    expect(hideA).not.toHaveBeenCalled()
  })

  it('ignores a stale hide from a menu that is no longer active', () => {
    const { activate, deactivate } = useActiveContextMenu()
    const hideA = vi.fn()
    const hideB = vi.fn()

    activate(hideA)
    activate(hideB)
    // A late deactivate from the already-superseded menu must not clear B.
    deactivate(hideA)

    const hideC = vi.fn()
    activate(hideC)
    expect(hideB).toHaveBeenCalledTimes(1)
  })
})
