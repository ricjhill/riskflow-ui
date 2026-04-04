import { useMemo } from 'react'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSessionContext } from './SessionContext'
import { buildNodes, buildEdges } from './graph-utils'
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

function MappingStep({ onNext, onBack }: MappingStepProps) {
  const { session } = useSessionContext()

  const nodes = useMemo(() => {
    if (!session) return []
    return buildNodes(
      session.source_headers,
      session.target_fields,
      session.mappings,
      session.unmapped_headers,
    )
  }, [session])

  const edges = useMemo(() => {
    if (!session) return []
    return buildEdges(session.mappings)
  }, [session])

  if (!session) return <p>No session loaded.</p>

  return (
    <div className="mapping-step">
      <div className="mapping-step-canvas" style={{ width: '100%', height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        />
      </div>
      <div className="mapping-step-actions">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={onNext}>
          Save Mappings
        </button>
      </div>
    </div>
  )
}

export default MappingStep
