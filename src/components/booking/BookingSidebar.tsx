import { Building2, Stethoscope, Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Doctor } from '@/types';

type Step = 1 | 2 | 3;

interface Service {
  id: string;
  service_name: string;
  fee: number;
}

interface Props {
  step: Step;
  clinicName: string;
  clinicCity?: string;
  selectedDoctor?: Doctor;
  selectedDate: string;
  selectedTime: string;
  selectedService?: Service;
  baseFee: number;
  totalFee: number;
  patientName: string;
  patientPhone: string;
  canProceed: boolean;
  onProceed: () => void;
}

export function BookingSidebar({
  step, clinicName, clinicCity, selectedDoctor,
  selectedDate, selectedTime, selectedService,
  baseFee, totalFee, patientName, patientPhone,
  canProceed, onProceed,
}: Props) {
  return (
    <div className="w-full lg:w-[300px] shrink-0">
      <div className="sticky top-24">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-5 border-b border-primary/10">
            <h3 className="text-[16px] font-black text-slate-900">Booking Summary</h3>
          </div>
          <div className="p-6 space-y-4">

            {/* Clinic */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Clinic</p>
                <p className="text-[13px] font-bold text-slate-800">{clinicName}</p>
                {clinicCity && <p className="text-[11px] text-slate-400 font-medium">{clinicCity}</p>}
              </div>
            </div>

            {/* Doctor */}
            {selectedDoctor && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Stethoscope className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Specialist</p>
                  <p className="text-[13px] font-bold text-slate-800">{selectedDoctor.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{selectedDoctor.specialization}</p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            {selectedDate && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                  <p className="text-[13px] font-bold text-slate-800">{format(parseISO(selectedDate), 'EEE, d MMM yyyy')}</p>
                  <p className="text-[11px] text-primary font-extrabold">{selectedTime ? selectedTime.slice(0, 5) : 'No slot selected'}</p>
                </div>
              </div>
            )}

            {/* Patient info (step 2+) */}
            {step >= 2 && patientName && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Patient</p>
                  <p className="text-[13px] font-bold text-slate-800">{patientName}</p>
                  {patientPhone && <p className="text-[11px] text-slate-400 font-medium">{patientPhone}</p>}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 font-medium">Consultation</span>
                <span className="font-bold text-slate-700">₹{baseFee}</span>
              </div>
              {selectedService && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-medium">{selectedService.service_name}</span>
                  <span className="font-bold text-slate-700">₹{selectedService.fee}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[13px] font-bold text-slate-500">Total Fee</span>
                <span className="text-[22px] font-black text-primary">₹{totalFee}.00</span>
              </div>
            </div>

            {step === 1 && (
              <button onClick={onProceed} disabled={!canProceed} className="w-full bg-primary disabled:opacity-50 hover:bg-primary/90 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-primary/20 text-[14px]">
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
