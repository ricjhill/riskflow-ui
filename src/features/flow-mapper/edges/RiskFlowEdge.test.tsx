import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReactFlowProvider, Position } from '@xyflow/react'
import RiskFlowEdge from './RiskFlowEdge'

function renderEdge(confidence: number) {
  return render(
    <ReactFlowProvider>
      <svg>
        <RiskFlowEdge
          id="test-edge"
          source="source-col1"
          target="target-field1"
          sourceX={0}
          sourceY={50}
          targetX={400}
          targetY={50}
          sourcePosition={Position.Right}
          targetPosition={Position.Left}
          data={{ confidence }}
        />
      </svg>
    </ReactFlowProvider>,
  )
}

describe('RiskFlowEdge', () => {
  it('renders glow and flow paths', () => {
    const { container } = renderEdge(0.9)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it('scales stroke width by confidence', () => {
    const { container } = renderEdge(0.9)
    const paths = container.querySelectorAll('path')
    const flowPath = paths[paths.length - 1]
    const strokeWidth = parseFloat(flowPath.getAttribute('stroke-width') ?? '0')
    expect(strokeWidth).toBeGreaterThan(10)
  })

  it('renders thin stroke for low confidence', () => {
    const { container } = renderEdge(0.2)
    const paths = container.querySelectorAll('path')
    const flowPath = paths[paths.length - 1]
    const strokeWidth = parseFloat(flowPath.getAttribute('stroke-width') ?? '0')
    expect(strokeWidth).toBeLessThan(8)
  })
})
