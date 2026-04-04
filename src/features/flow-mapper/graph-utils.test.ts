import { describe, it, expect } from 'vitest'
import { buildNodes } from './graph-utils'
import type { ColumnMapping } from '@/types/api'

describe('buildNodes', () => {
  it('creates positioned source and target nodes', () => {
    const mappings: ColumnMapping[] = [
      { source_header: 'col1', target_field: 'field1', confidence: 0.95 },
    ]
    const nodes = buildNodes(['col1', 'col2'], ['field1'], mappings, ['col2'])

    expect(nodes).toHaveLength(3)

    // Source nodes on the left (x = 0)
    const sources = nodes.filter((n) => n.type === 'sourceHeader')
    expect(sources).toHaveLength(2)
    expect(sources[0].position.x).toBe(0)
    expect(sources[0].data.label).toBe('col1')
    expect(sources[0].data.unmapped).toBe(false)
    expect(sources[1].data.label).toBe('col2')
    expect(sources[1].data.unmapped).toBe(true)

    // Target nodes on the right (x > 0)
    const targets = nodes.filter((n) => n.type === 'targetField')
    expect(targets).toHaveLength(1)
    expect(targets[0].position.x).toBeGreaterThan(0)
    expect(targets[0].data.label).toBe('field1')
    expect(targets[0].data.connected).toBe(true)

    // Y positions are spaced
    expect(sources[0].position.y).toBeLessThan(sources[1].position.y)
  })
})
