import { Check } from 'lucide-react';

interface Step { id: number; title: string; description: string; }
interface Props { steps: Step[]; currentStep: number; }

export function ProgressSteps({ steps, currentStep }: Props) {
  const pct = ((currentStep - 1) / (steps.length - 1)) * 100;
  return (
    <div className="w-full">
      {/* Mobile bar */}
      <div className="sm:hidden mb-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-extrabold text-slate-700">Step {currentStep} of {steps.length}</span>
          <span className="text-[13px] font-bold text-primary">{steps[currentStep - 1]?.title}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
        </div>
      </div>

      {/* Desktop full steps */}
      <div className="hidden sm:block relative">
        {/* connector track */}
        <div className="absolute top-[18px] left-[5%] right-[5%] h-px bg-slate-200 z-0" />
        <div
          className="absolute top-[18px] left-[5%] h-[2px] bg-primary z-0 transition-all duration-500"
          style={{ width: `${pct * 0.9}%` }}
        />
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[14px] border-2 transition-all duration-300 ${isDone ? 'bg-primary border-primary text-white' : isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {isDone ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <p className={`text-[11px] font-extrabold uppercase tracking-widest mt-2 text-center ${isActive ? 'text-primary' : isDone ? 'text-slate-500' : 'text-slate-300'}`}>{step.title}</p>
                <p className={`text-[10px] font-medium text-center hidden lg:block ${isActive ? 'text-slate-400' : 'text-slate-300'}`}>{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
