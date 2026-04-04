import { useMemo, useState, useCallback } from 'react'
import { ReactFlow } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSessionContext } from './SessionContext'
import { buildNodes, buildEdges, applySnap } from './graph-utils'
import SourceHeaderNode from './nodes/SourceHeaderNode'
import TargetFieldNode from './nodes/TargetFieldNode'
import RiskFlowEdge from './edges/RiskFlowEdge'

const nodeTypes = {
  sourceHeader: SourceHeaderNode,
  targetField: TargetFieldNode,
}

const edgeTypes = {
  riskFlow: RiskFlowEdge,
}

interface MappingStepProps {
  onNext: () => void
  onBack: () => void
}

function edgesToMappings(edges: Edge[]) {
  return edges.map((e) => ({
    source_header: e.source.replace('source-', ''),
    target_field: e.target.replace('target-', ''),
    confidence: (e.data?.confidence as number) ?? 1.0,
  }))
}

function MappingStep({ onNext, onBack }: MappingStepProps) {
  const { session, updateMappings } = useSessionContext()
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [localEdges, setLocalEdges] = useState<Edge[] | null>(null)

  const initialEdges = useMemo(() => {
    if (!session) return []
    return buildEdges(session.mappings)
  }, [session])

  const edges = localEdges ?? initialEdges

  const nodes = useMemo(() => {
    if (!session) return []
    const mappedTargets = new Set(edges.map((e) => e.target.replace('target-', '')))
    const mappedSources = new Set(edges.map((e) => e.source.replace('source-', '')))
    const unmapped = session.source_headers.filter((h) => !mappedSources.has(h))
    return buildNodes(
      session.source_headers,
      session.target_fields,
      edgesToMappings(edges),
      unmapped,
    )
  }, [session, edges])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string; type?: string }) => {
      if (node.type === 'sourceHeader') {
        setActiveSource(node.id.replace('source-', ''))
      } else if (node.type === 'targetField' && activeSource) {
        const targetField = node.id.replace('target-', '')
        setLocalEdges(applySnap(edges, activeSource, targetField))
        setActiveSource(null)
      }
    },
    [activeSource, edges],
  )

  async function handleSave() {
    const mappings = edgesToMappings(edges)
    const mappedSources = new Set(mappings.map((m) => m.source_header))
    const unmapped = session ? session.source_headers.filter((h) => !mappedSources.has(h)) : []
    await updateMappings(mappings, unmapped)
    onNext()
  }

  if (!session) return <p>No session loaded.</p>

  return (
    <div className="mapping-step">
      <div className="mapping-step-canvas" style={{ width: '100%', height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        />
      </div>
      {activeSource && (
        <p className="mapping-step-hint">
          Click a target field to map <strong>{activeSource}</strong>
        </p>
      )}
      <div className="mapping-step-actions">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={handleSave}>
          Save Mappings
        </button>
      </div>
    </div>
  )
}

export default MappingStep
