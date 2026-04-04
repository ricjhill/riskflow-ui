import { useState } from 'react'
import Stepper from '@/components/Stepper'
import { SessionProvider } from './SessionContext'

const STEPS = ['Upload', 'Review', 'Results']

function FlowMapper() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <SessionProvider>
      <div className="flow-mapper">
        <Stepper steps={STEPS} currentStep={currentStep} />
        {currentStep === 0 && <p>Upload step placeholder</p>}
        {currentStep === 1 && <p>Review step placeholder</p>}
        {currentStep === 2 && <p>Results step placeholder</p>}
      </div>
    </SessionProvider>
  )
}

export default FlowMapper
