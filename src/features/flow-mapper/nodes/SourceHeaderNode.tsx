import { Handle, Position } from '@xyflow/react'

interface SourceHeaderNodeProps {
  id: string
  data: { label: string; unmapped: boolean }
}

function SourceHeaderNode({ data }: SourceHeaderNodeProps) {
  return (
    <div className={`source-node ${data.unmapped ? 'source-node--unmapped' : ''}`}>
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default SourceHeaderNode
