import { describe, it, expect } from 'vitest'
import { buildNodes, buildEdges, confidenceColor } from './graph-utils'
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

describe('buildEdges', () => {
  it('creates edges with correct source/target IDs and confidence data', () => {
    const mappings: ColumnMapping[] = [
      { source_header: 'col1', target_field: 'field1', confidence: 0.95 },
      { source_header: 'col2', target_field: 'field2', confidence: 0.6 },
    ]
    const edges = buildEdges(mappings)

    expect(edges).toHaveLength(2)

    expect(edges[0].id).toBe('edge-col1-field1')
    expect(edges[0].source).toBe('source-col1')
    expect(edges[0].target).toBe('target-field1')
    expect(edges[0].data?.confidence).toBe(0.95)
    expect(edges[0].type).toBe('riskFlow')

    expect(edges[1].data?.confidence).toBe(0.6)
  })
})

describe('confidenceColor', () => {
  it('returns high for scores >= 0.8', () => {
    expect(confidenceColor(0.95)).toBe('high')
    expect(confidenceColor(0.8)).toBe('high')
  })

  it('returns medium for scores >= 0.5', () => {
    expect(confidenceColor(0.6)).toBe('medium')
    expect(confidenceColor(0.5)).toBe('medium')
  })

  it('returns low for scores > 0', () => {
    expect(confidenceColor(0.3)).toBe('low')
    expect(confidenceColor(0.01)).toBe('low')
  })

  it('returns none for 0', () => {
    expect(confidenceColor(0)).toBe('none')
  })
})
