import { Handle, Position } from '@xyflow/react'

interface SourceHeaderNodeProps {
  id: string
  data: { label: string; unmapped: boolean; active?: boolean }
}

function SourceHeaderNode({ data }: SourceHeaderNodeProps) {
  const classes = [
    'source-node',
    data.unmapped ? 'source-node--unmapped' : '',
    data.active ? 'source-node--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default SourceHeaderNode
