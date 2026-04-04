# Add a New API Endpoint

When the RiskFlow backend adds a new endpoint, follow these steps to expose it in the UI.

## 1. Add the response type

If the endpoint returns a new shape, add the interface to `src/types/api.ts`:

```typescript
export interface NewThing {
  id: string
  name: string
}
```

## 2. Add the client function

Add a typed wrapper in `src/api/client.ts`:

```typescript
export function getNewThing(id: string): Promise<NewThing> {
  return request(`/new-things/${id}`)
}
```

The `request` helper handles JSON parsing and throws `ApiResponseError` on non-2xx responses. For POST/PUT/PATCH, pass `method` and `body` in the `init` parameter.

## 3. Add the nginx proxy route

If the endpoint uses a new URL prefix, add a `location` block to `nginx.conf`:

```nginx
location /new-things {
    proxy_pass http://api:8000;
}
```

This is only needed for Docker deployments. In local development, `VITE_API_URL` points directly to the API.

## 4. Write a test

Create or extend a test file next to the source. Mock at the fetch level:

```typescript
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ id: '1', name: 'test' }),
})

const result = await getNewThing('1')
expect(result).toEqual({ id: '1', name: 'test' })
```
