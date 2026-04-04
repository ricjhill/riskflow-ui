import { getBezierPath } from '@xyflow/react'
import { confidenceColor } from '../graph-utils'

interface RiskFlowEdgeProps {
  id: string
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: string
  targetPosition: string
  data?: { confidence: number }
}

const MIN_STROKE = 2
const MAX_STROKE = 18

function RiskFlowEdge({ sourceX, sourceY, targetX, targetY, data }: RiskFlowEdgeProps) {
  const confidence = data?.confidence ?? 0
  const strokeWidth = MIN_STROKE + confidence * (MAX_STROKE - MIN_STROKE)
  const level = confidenceColor(confidence)

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature: 0.8,
  })

  return (
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
  )
}

export default RiskFlowEdge
