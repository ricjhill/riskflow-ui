# Hooks Reference

Custom React hooks in `src/hooks/`.

## useSession

Manages the full lifecycle of a mapping session: create, edit mappings, finalise, and destroy.

```typescript
import { useSession } from '@/hooks/useSession'

const { session, error, loading, create, updateMappings, finalise, destroy } = useSession()
```

### Return value

| Field | Type | Description |
|-------|------|-------------|
| `session` | `Session \| null` | Current session state, or null if none |
| `error` | `string \| null` | Last error message, or null |
| `loading` | `boolean` | True during `finalise()` call |
| `create` | `(file, schema?, sheetName?) => Promise<boolean>` | Upload file, create session. Returns `true` on success. |
| `updateMappings` | `(mappings, unmappedHeaders) => Promise<void>` | Save edited mappings to the API |
| `finalise` | `() => Promise<void>` | Validate all rows against the target schema |
| `destroy` | `() => Promise<void>` | Delete the session and reset state to null |

### Why `create` returns `Promise<boolean>`

React state updates are async. After `await create(file)`, reading `error` gives the stale pre-call value. Returning a boolean lets callers branch on success without reading state:

```typescript
const ok = await create(file)
if (ok) onNext()  // instead of checking error === null (stale closure)
```

### Usage

`useSession` is typically consumed via `SessionContext` rather than directly:

```typescript
// In a feature component
import { useSessionContext } from './SessionContext'

function MyComponent() {
  const { session, create } = useSessionContext()
  // ...
}
```

---

## useSchemas

Fetches the list of available target schemas on mount.

```typescript
import { useSchemas } from '@/hooks/useSchemas'

const { schemas, loading, error } = useSchemas()
```

### Return value

| Field | Type | Description |
|-------|------|-------------|
| `schemas` | `string[]` | List of schema names |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Error message if fetch failed |

### Behaviour

- Fetches on mount via `listSchemas()` — no refetch mechanism
- `loading` starts `true`, becomes `false` after success or failure
- `error` is set on fetch failure, `schemas` remains `[]`
