import { vi } from 'vitest'

/**
 * Mock global fetch to return a JSON response.
 * Returns the mock function for assertions.
 */
export function mockFetch(response: unknown, options?: { status?: number }) {
  const status = options?.status ?? 200

  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

/**
 * Mock fetch to reject with a network error.
 */
export function mockFetchError(message = 'Network error') {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError(message))
}
