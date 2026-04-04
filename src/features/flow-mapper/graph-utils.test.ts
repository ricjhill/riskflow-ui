import { describe, it, expect } from 'vitest'
import { buildNodes, buildEdges, confidenceColor, applySnap, edgesToMappings } from './graph-utils'
import type { ColumnMapping } from '@/types/api'
import type { Edge } from '@xyflow/react'

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

describe('applySnap', () => {
  const existingEdges: Edge[] = [
    {
      id: 'edge-col1-field1',
      source: 'source-col1',
      target: 'target-field1',
      type: 'riskFlow',
      data: { confidence: 0.95 },
    },
  ]

  it('adds a new mapping at confidence 1.0', () => {
    const result = applySnap(existingEdges, 'col2', 'field2')
    expect(result).toHaveLength(2)
    const newEdge = result.find((e) => e.id === 'edge-col2-field2')
    expect(newEdge).toBeDefined()
    expect(newEdge!.data?.confidence).toBe(1.0)
  })

  it('replaces existing mapping to the same target (1:1 constraint)', () => {
    const result = applySnap(existingEdges, 'col2', 'field1')
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('source-col2')
    expect(result[0].target).toBe('target-field1')
    expect(result[0].data?.confidence).toBe(1.0)
  })

  it('works with empty initial edges', () => {
    const result = applySnap([], 'col1', 'field1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('edge-col1-field1')
  })
})

describe('edgesToMappings', () => {
  it('converts edges back to ColumnMapping array', () => {
    const edges: Edge[] = [
      {
        id: 'edge-col1-field1',
        source: 'source-col1',
        target: 'target-field1',
        type: 'riskFlow',
        data: { confidence: 0.95 },
      },
      {
        id: 'edge-col2-field2',
        source: 'source-col2',
        target: 'target-field2',
        type: 'riskFlow',
        data: { confidence: 1.0 },
      },
    ]
    const mappings = edgesToMappings(edges)

    expect(mappings).toHaveLength(2)
    expect(mappings[0]).toEqual({ source_header: 'col1', target_field: 'field1', confidence: 0.95 })
    expect(mappings[1]).toEqual({ source_header: 'col2', target_field: 'field2', confidence: 1.0 })
  })

  it('defaults confidence to 1.0 when edge data is missing', () => {
    const edges: Edge[] = [
      { id: 'edge-col1-field1', source: 'source-col1', target: 'target-field1', type: 'riskFlow' },
    ]
    const mappings = edgesToMappings(edges)
    expect(mappings[0].confidence).toBe(1.0)
  })

  it('handles headers containing "source-" prefix correctly', () => {
    const edges: Edge[] = [
      {
        id: 'edge-source-premium-field1',
        source: 'source-source-premium',
        target: 'target-field1',
        type: 'riskFlow',
        data: { confidence: 0.8 },
      },
    ]
    const mappings = edgesToMappings(edges)
    expect(mappings[0].source_header).toBe('source-premium')
  })
})
