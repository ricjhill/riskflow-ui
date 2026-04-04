import { useState } from 'react'
import Stepper from '@/components/Stepper'
import { SessionProvider } from './SessionContext'
import UploadStep from './UploadStep'

const STEPS = ['Upload', 'Review', 'Results']

function FlowMapper() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <SessionProvider>
      <div className="flow-mapper">
        <Stepper steps={STEPS} currentStep={currentStep} />
        {currentStep === 0 && <UploadStep onNext={() => setCurrentStep(1)} />}
        {currentStep === 1 && <p>Review step placeholder</p>}
        {currentStep === 2 && <p>Results step placeholder</p>}
      </div>
    </SessionProvider>
  )
}

export default FlowMapper
