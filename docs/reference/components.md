# Components Reference

Shared UI components in `src/components/`. These are generic — no feature-specific logic.

## Stepper

Multi-step progress indicator. Shows all steps with the current step highlighted and earlier steps marked as completed.

```typescript
import Stepper from '@/components/Stepper'

<Stepper steps={['Upload', 'Review', 'Results']} currentStep={1} />
```

| Prop | Type | Description |
|------|------|-------------|
| `steps` | `string[]` | Step labels |
| `currentStep` | `number` | Zero-based index of the active step |

Renders an `<ol>` with `role="list"`. Steps before `currentStep` get the `completed` class.

---

## FileUpload

File input with click-to-browse and file type validation.

```typescript
import FileUpload from '@/components/FileUpload'

<FileUpload
  onFileSelect={(file) => handleFile(file)}
  accept=".csv,.xlsx,.xls"
  error="File too large"
  disabled={uploading}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `onFileSelect` | `(file: File) => void` | Called when a valid file is selected |
| `accept` | `string` (optional) | Comma-separated file extensions to accept |
| `error` | `string` (optional) | External error message to display |
| `disabled` | `boolean` (optional) | Disables the input and button |

Rejects files with extensions not in `accept`. Displays its own validation error or the external `error` prop.

---

## SchemaList

Renders a list of target schema names with loading and error states.

```typescript
import SchemaList from '@/components/SchemaList'

<SchemaList />
```

No props. Uses `useSchemas()` internally to fetch and display schema names on mount. Shows loading text, then the list, or an error message.

---

## ApiStatus

Developer tool showing API health status and available schemas.

```typescript
import ApiStatus from '@/components/ApiStatus'

<ApiStatus />
```

No props. Calls `health()` and renders the API connection state (pending → OK or FAIL). Includes a `SchemaList` for schema exploration. Available at the `/api-status` route.
