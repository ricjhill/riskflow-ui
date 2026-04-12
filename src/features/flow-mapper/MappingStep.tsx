import { useMemo, useState, useCallback } from 'react'
import { ReactFlow, Background, BackgroundVariant, Panel } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSessionContext } from './SessionContext'
import { buildNodes, buildEdges, applySnap, edgesToMappings } from './graph-utils'
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
    const mappedSources = new Set(edges.map((e) => e.source.replace('source-', '')))
    const unmapped = session.source_headers.filter((h) => !mappedSources.has(h))
    const base = buildNodes(
      session.source_headers,
      session.target_fields,
      edgesToMappings(edges),
      unmapped,
    )
    return base.map((n) => {
      if (n.type === 'sourceHeader') {
        return { ...n, data: { ...n.data, active: n.id === `source-${activeSource}` } }
      }
      if (n.type === 'targetField') {
        return { ...n, data: { ...n.data, awaiting: activeSource !== null } }
      }
      return n
    })
  }, [session, edges, activeSource])

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
      <div className="mapping-legend">
        <span className="mapping-legend-title">Confidence</span>
        <span className="mapping-legend-item">
          <span className="mapping-legend-dot mapping-legend-dot--high" />
          High (&ge;80%)
        </span>
        <span className="mapping-legend-item">
          <span className="mapping-legend-dot mapping-legend-dot--medium" />
          Medium (&ge;50%)
        </span>
        <span className="mapping-legend-item">
          <span className="mapping-legend-dot mapping-legend-dot--low" />
          Low (&gt;0%)
        </span>
        <span className="mapping-legend-item">
          <span className="mapping-legend-dot mapping-legend-dot--none" />
          None
        </span>
      </div>
      <div
        className="mapping-step-canvas"
        style={{ width: '100%', height: 'clamp(400px, 60vh, 700px)' }}
      >
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
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--border)" />
          <Panel position="top-left" className="mapping-column-label">
            Source Columns
          </Panel>
          <Panel position="top-right" className="mapping-column-label">
            Target Fields
          </Panel>
        </ReactFlow>
      </div>
      <div className="mapping-step-instruction" role="status" aria-live="polite">
        {activeSource ? (
          <>
            <span className="mapping-step-instruction-icon" aria-hidden="true">
              &#x2192;
            </span>
            Now click a <strong>target field</strong> to map <strong>{activeSource}</strong>
          </>
        ) : (
          <>
            <span className="mapping-step-instruction-icon" aria-hidden="true">
              &#x1F5B1;
            </span>
            Click a <strong>source column</strong> to begin mapping
          </>
        )}
      </div>
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
