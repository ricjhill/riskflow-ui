interface StepperProps {
  steps: string[]
  currentStep: number
}

function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="stepper" role="list">
      {steps.map((label, i) => (
        <li
          key={label}
          className={`stepper-step ${i === currentStep ? 'stepper-step--active' : ''} ${i < currentStep ? 'stepper-step--completed' : ''}`}
          aria-current={i === currentStep ? 'step' : undefined}
          data-completed={i < currentStep ? 'true' : undefined}
        >
          <span className="stepper-number">{i + 1}</span>
          <span className="stepper-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

export default Stepper
