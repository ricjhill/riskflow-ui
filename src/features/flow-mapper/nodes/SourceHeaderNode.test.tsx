import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import SourceHeaderNode from './SourceHeaderNode'

function renderNode(data: { label: string; unmapped: boolean }) {
  return render(
    <ReactFlowProvider>
      <SourceHeaderNode id="test" data={data} />
    </ReactFlowProvider>,
  )
}

describe('SourceHeaderNode', () => {
  it('renders header text', () => {
    renderNode({ label: 'Column A', unmapped: false })
    expect(screen.getByText('Column A')).toBeInTheDocument()
  })

  it('has unmapped class when unmapped', () => {
    const { container } = renderNode({ label: 'Col', unmapped: true })
    expect(container.querySelector('.source-node--unmapped')).toBeInTheDocument()
  })

  it('does not have unmapped class when mapped', () => {
    const { container } = renderNode({ label: 'Col', unmapped: false })
    expect(container.querySelector('.source-node--unmapped')).not.toBeInTheDocument()
  })
})
