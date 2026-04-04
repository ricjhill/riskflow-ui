import { useEffect, useState } from 'react'
import { health, listSchemas, getSchema, ApiResponseError } from '@/api/client'
import type { Schema } from '@/types/api'

interface StatusCheck {
  name: string
  status: 'pending' | 'ok' | 'error'
  detail: string
}

function ApiStatus() {
  const [checks, setChecks] = useState<StatusCheck[]>([
    { name: 'Health', status: 'pending', detail: 'Checking...' },
    { name: 'Schemas', status: 'pending', detail: 'Checking...' },
  ])
  const [schemas, setSchemas] = useState<Schema[]>([])

  useEffect(() => {
    const update = (index: number, patch: Partial<StatusCheck>) => {
      setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
    }

    health()
      .then((r) => update(0, { status: 'ok', detail: r.status }))
      .catch((err: unknown) => {
        const msg = err instanceof ApiResponseError ? err.message : 'Connection failed'
        update(0, { status: 'error', detail: msg })
      })

    listSchemas()
      .then((names) =>
        Promise.all(names.map((n) => getSchema(n))).then((details) => ({ names, details })),
      )
      .then(({ names, details }) => {
        update(1, { status: 'ok', detail: `${names.length} schema(s): ${names.join(', ')}` })
        setSchemas(details)
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiResponseError ? err.message : 'Connection failed'
        update(1, { status: 'error', detail: msg })
      })
  }, [])

  return (
    <section>
      <h2>API Connection</h2>
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td>{c.status === 'pending' ? '...' : c.status === 'ok' ? 'OK' : 'FAIL'}</td>
              <td>{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {schemas.length > 0 && (
        <>
          <h2>Schema Details</h2>
          {schemas.map((s) => (
            <details key={s.name}>
              <summary>
                {s.name} — {Object.keys(s.fields).length} fields
              </summary>
              <ul>
                {Object.entries(s.fields).map(([name, def]) => (
                  <li key={name}>
                    <strong>{name}</strong>: {def.type}
                    {def.required ? ' (required)' : ''}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </>
      )}
    </section>
  )
}

export default ApiStatus
