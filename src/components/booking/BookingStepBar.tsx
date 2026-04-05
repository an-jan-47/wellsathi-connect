import { Check } from 'lucide-react';

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: 'Clinic', sublabel: 'Choose Specialist' },
  { num: 2, label: 'Patient', sublabel: 'Patient Info' },
  { num: 3, label: 'Payment', sublabel: 'Confirm Booking' },
] as const;

interface Props {
  step: Step;
}

export function BookingStepBar({ step }: Props) {
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm">
      <div className="container max-w-[1100px] py-5">
        <div className="flex items-center justify-between relative">
          {/* connector line */}
          <div className="absolute top-[18px] left-[10%] right-[10%] h-px bg-slate-200 z-0" />
          <div
            className="absolute top-[18px] left-[10%] h-[2px] bg-primary z-0 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '40%' : '80%' }}
          />
          {STEPS.map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[15px] transition-all duration-300 border-2 ${isDone ? 'bg-primary border-primary text-white' : isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {isDone ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-[11px] font-extrabold uppercase tracking-widest mt-2 ${isActive ? 'text-primary' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</span>
                <span className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{s.sublabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
