import { useState } from 'react'
import Stepper from '@/components/Stepper'
import { SessionProvider } from './SessionContext'
import UploadStep from './UploadStep'
import MappingStep from './MappingStep'
import ResultsStep from './ResultsStep'
import './flow-mapper.css'

const STEPS = ['Upload', 'Review', 'Results']

function FlowMapper() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <SessionProvider>
      <div className="flow-mapper">
        <Stepper steps={STEPS} currentStep={currentStep} />
        {currentStep === 0 && <UploadStep onNext={() => setCurrentStep(1)} />}
        {currentStep === 1 && (
          <MappingStep onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />
        )}
        {currentStep === 2 && (
          <ResultsStep
            onBack={() => setCurrentStep(1)}
            onReset={() => setCurrentStep(0)}
            onFinalised={() => setCurrentStep(3)}
          />
        )}
      </div>
    </SessionProvider>
  )
}

export default FlowMapper
