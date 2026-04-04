import { vi } from 'vitest'

/**
 * Mock global fetch to return a JSON response.
 * Returns the mock function for assertions.
 */
export function mockFetch(response: unknown, options?: { status?: number }) {
  const status = options?.status ?? 200

  const body = status === 204 ? null : JSON.stringify(response)
  const init: ResponseInit =
    status === 204 ? { status } : { status, headers: { 'Content-Type': 'application/json' } }

  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, init))
}

/**
 * Mock fetch to return different responses for sequential calls.
 * Each call returns the next response in order; after exhaustion,
 * repeats the last response.
 */
export function mockFetchSequence(responses: { body: unknown; status?: number }[]) {
  let i = 0
  return vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    const r = responses[Math.min(i++, responses.length - 1)]
    const status = r.status ?? 200
    const body = status === 204 ? null : JSON.stringify(r.body)
    const init: ResponseInit =
      status === 204 ? { status } : { status, headers: { 'Content-Type': 'application/json' } }
    return Promise.resolve(new Response(body, init))
  })
}

/**
 * Mock fetch to reject with a network error.
 */
export function mockFetchError(message = 'Network error') {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError(message))
}
