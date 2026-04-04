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
