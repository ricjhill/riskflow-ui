import { Handle, Position } from '@xyflow/react'

interface TargetFieldNodeProps {
  id: string
  data: { label: string; connected: boolean }
}

function TargetFieldNode({ data }: TargetFieldNodeProps) {
  return (
    <div className={`target-node ${data.connected ? 'target-node--connected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <span>{data.label}</span>
    </div>
  )
}

export default TargetFieldNode
