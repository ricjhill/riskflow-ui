import { Handle, Position } from '@xyflow/react'

interface TargetFieldNodeProps {
  id: string
  data: { label: string; connected: boolean; awaiting?: boolean }
}

function TargetFieldNode({ data }: TargetFieldNodeProps) {
  const classes = [
    'target-node',
    data.connected ? 'target-node--connected' : '',
    data.awaiting ? 'target-node--awaiting' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Left} />
      <span>{data.label}</span>
    </div>
  )
}

export default TargetFieldNode
