import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute('open')
  }
  HTMLElement.prototype.scrollIntoView ??= function () {}
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
