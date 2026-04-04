import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// ReactFlow requires ResizeObserver which jsdom doesn't provide
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})
