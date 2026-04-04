import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import TargetFieldNode from './TargetFieldNode'

function renderNode(data: { label: string; connected: boolean }) {
  return render(
    <ReactFlowProvider>
      <TargetFieldNode id="test" data={data} />
    </ReactFlowProvider>,
  )
}

describe('TargetFieldNode', () => {
  it('renders field text', () => {
    renderNode({ label: 'Gross_Premium', connected: false })
    expect(screen.getByText('Gross_Premium')).toBeInTheDocument()
  })

  it('has connected class when connected', () => {
    const { container } = renderNode({ label: 'Field', connected: true })
    expect(container.querySelector('.target-node--connected')).toBeInTheDocument()
  })

  it('does not have connected class when disconnected', () => {
    const { container } = renderNode({ label: 'Field', connected: false })
    expect(container.querySelector('.target-node--connected')).not.toBeInTheDocument()
  })
})
