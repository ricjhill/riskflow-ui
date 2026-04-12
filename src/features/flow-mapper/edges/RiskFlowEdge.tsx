import { getBezierPath, EdgeLabelRenderer, Position } from '@xyflow/react'
import { confidenceColor } from '../graph-utils'

interface RiskFlowEdgeProps {
  id: string
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: { confidence: number }
}

const MIN_STROKE = 2
const MAX_STROKE = 18

function RiskFlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: RiskFlowEdgeProps) {
  const confidence = data?.confidence ?? 0
  const strokeWidth = MIN_STROKE + confidence * (MAX_STROKE - MIN_STROKE)
  const level = confidenceColor(confidence)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.8,
  })

  return (
    <>
      <g className={`risk-flow-edge risk-flow-edge--${level}`}>
        {/* Glow layer */}
        <path
          d={edgePath}
          fill="none"
          stroke={`var(--confidence-${level})`}
          strokeWidth={strokeWidth + 6}
          strokeOpacity={0.3}
        />
        {/* Flow layer */}
        <path
          d={edgePath}
          fill="none"
          stroke={`var(--confidence-${level})`}
          strokeWidth={strokeWidth}
          strokeOpacity={0.8}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className={`risk-flow-edge-label risk-flow-edge-label--${level}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {Math.round(confidence * 100)}%
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default RiskFlowEdge
