import * as React from "react"
import { cn } from "@/lib/utils"

interface Step {
  title: string
  description?: string
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, onStepClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between", className)}
        {...props}
      >
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          
          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  disabled={!onStepClick}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                      ? "border-primary bg-background text-primary"
                      : "border-muted-foreground/30 bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="font-medium">{index + 1}</span>
                  )}
                </button>
                {/* Step Title */}
                <span className={cn(
                  "mt-2 text-sm font-medium",
                  isActive || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {/* Step Description */}
                {step.description && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </span>
                )}
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-4",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

export { Stepper }