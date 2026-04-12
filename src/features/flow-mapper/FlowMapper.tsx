import { useState } from 'react'
import Stepper from '@/components/Stepper'
import { SessionProvider, useSessionContext } from './SessionContext'
import UploadStep from './UploadStep'
import MappingStep from './MappingStep'
import ResultsStep from './ResultsStep'
import SummaryStep from './SummaryStep'
import './flow-mapper.css'

const STEPS = ['Upload', 'Review', 'Results', 'Summary']

function FlowMapperInner() {
  const [currentStep, setCurrentStep] = useState(0)
  const { session, destroy } = useSessionContext()

  async function handleStartNew() {
    await destroy()
    setCurrentStep(0)
  }

  return (
    <div className="flow-mapper">
      <div className="flow-mapper-card">
        <Stepper steps={STEPS} currentStep={currentStep} />
        {currentStep === 0 && <UploadStep onNext={() => setCurrentStep(1)} />}
        {currentStep === 1 && (
          <MappingStep onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />
        )}
        {currentStep === 2 && (
          <ResultsStep
            onBack={() => setCurrentStep(1)}
            onReset={handleStartNew}
            onFinalised={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && session && <SummaryStep session={session} onReset={handleStartNew} />}
      </div>
    </div>
  )
}

function FlowMapper() {
  return (
    <SessionProvider>
      <FlowMapperInner />
    </SessionProvider>
  )
}

export default FlowMapper
