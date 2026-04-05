import type { Node, Edge } from '@xyflow/react'
import type { ColumnMapping } from '@/types/api'

const COLUMN_GAP = 400
const ROW_HEIGHT = 60
const ROW_PADDING = 20

function layoutColumn(count: number): number[] {
  return Array.from({ length: count }, (_, i) => ROW_PADDING + i * ROW_HEIGHT)
}

export interface SourceNodeData {
  label: string
  unmapped: boolean
}

export interface TargetNodeData {
  label: string
  connected: boolean
}

export function buildNodes(
  sourceHeaders: string[],
  targetFields: string[],
  mappings: ColumnMapping[],
  unmappedHeaders: string[],
): Node[] {
  const unmappedSet = new Set(unmappedHeaders)
  const connectedSet = new Set(mappings.map((m) => m.target_field))
  const sourceYs = layoutColumn(sourceHeaders.length)
  const targetYs = layoutColumn(targetFields.length)

  const sourceNodes: Node[] = sourceHeaders.map((header, i) => ({
    id: `source-${header}`,
    type: 'sourceHeader',
    position: { x: 0, y: sourceYs[i] },
    data: { label: header, unmapped: unmappedSet.has(header) },
  }))

  const targetNodes: Node[] = targetFields.map((field, i) => ({
    id: `target-${field}`,
    type: 'targetField',
    position: { x: COLUMN_GAP, y: targetYs[i] },
    data: { label: field, connected: connectedSet.has(field) },
  }))

  return [...sourceNodes, ...targetNodes]
}

export function buildEdges(mappings: ColumnMapping[]): Edge[] {
  return mappings.map((m) => ({
    id: `edge-${m.source_header}-${m.target_field}`,
    source: `source-${m.source_header}`,
    target: `target-${m.target_field}`,
    type: 'riskFlow',
    data: { confidence: m.confidence },
  }))
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none'

export function confidenceColor(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  if (score > 0) return 'low'
  return 'none'
}

export function edgesToMappings(edges: Edge[]): ColumnMapping[] {
  return edges.map((e) => ({
    source_header: e.source.replace('source-', ''),
    target_field: e.target.replace('target-', ''),
    confidence: (e.data?.confidence as number) ?? 1.0,
  }))
}

/**
 * Reorder targets so each target is near its connected source,
 * minimising edge crossings in a bipartite graph layout.
 *
 * For each target, compute the average index of its connected
 * sources (the "barycenter"). Sort targets by this value.
 * Unconnected targets go to the end in their original order.
 */
export function barycenterSort(
  sources: string[],
  targets: string[],
  mappings: ColumnMapping[],
): string[] {
  if (mappings.length === 0) return [...targets]

  const sourceIndex = new Map(sources.map((s, i) => [s, i]))

  // Build target → list of connected source indices
  const targetConnections = new Map<string, number[]>()
  for (const m of mappings) {
    const si = sourceIndex.get(m.source_header)
    if (si === undefined) continue
    const list = targetConnections.get(m.target_field) ?? []
    list.push(si)
    targetConnections.set(m.target_field, list)
  }

  // Compute barycenter (average source index) for each target
  const connected: { target: string; bary: number }[] = []
  const unconnected: string[] = []

  for (const t of targets) {
    const indices = targetConnections.get(t)
    if (indices && indices.length > 0) {
      const avg = indices.reduce((a, b) => a + b, 0) / indices.length
      connected.push({ target: t, bary: avg })
    } else {
      unconnected.push(t)
    }
  }

  connected.sort((a, b) => a.bary - b.bary)
  return [...connected.map((c) => c.target), ...unconnected]
}

export function applySnap(edges: Edge[], sourceHeader: string, targetField: string): Edge[] {
  // Remove any existing edge to this target (1:1 constraint)
  const filtered = edges.filter((e) => e.target !== `target-${targetField}`)
  const newEdge: Edge = {
    id: `edge-${sourceHeader}-${targetField}`,
    source: `source-${sourceHeader}`,
    target: `target-${targetField}`,
    type: 'riskFlow',
    data: { confidence: 1.0 },
  }
  return [...filtered, newEdge]
}
