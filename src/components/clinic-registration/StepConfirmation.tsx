import { useEffect, useState } from 'react';
import { Check, Loader2, Building2, MapPin, Users, FileCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ClinicRegistrationData } from '@/types/clinic-registration';

interface Props {
  data: ClinicRegistrationData;
  isSubmitting: boolean;
  isSuccess: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function SummaryCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-[14px] font-extrabold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[12px] font-medium text-slate-400 shrink-0">{label}</span>
      <span className="text-[13px] font-bold text-slate-700 text-right">{value}</span>
    </div>
  );
}

export function StepConfirmation({ data, isSubmitting, isSuccess, onBack, onSubmit }: Props) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); navigate('/dashboard/clinic'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  if (isSuccess) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-[28px] font-black text-slate-900 mb-2">Registration Submitted!</h2>
        <p className="text-slate-500 font-medium mb-2">Your clinic is pending verification by our team.</p>
        <p className="text-[13px] text-primary font-bold mb-6">Usually approved within 2 hours ✦</p>
        <p className="text-[13px] text-slate-400 mb-6">
          Redirecting to dashboard in <span className="font-black text-primary">{countdown}</span>s…
        </p>
        <button onClick={() => navigate('/dashboard/clinic')}
          className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20">
          Go to Dashboard Now →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-[26px] font-black text-slate-900">Review &amp; Confirm</h2>
        <p className="text-slate-400 font-medium mt-1 text-[14px]">Please review your information before submitting.</p>
      </div>

      <SummaryCard icon={Building2} title="Clinic Details">
        <div className="space-y-2">
          <SummaryRow label="Clinic Name" value={data.clinicName} />
          <SummaryRow label="City" value={data.city} />
          <SummaryRow label="Address" value={data.address} />
          {data.clinicImages?.length > 0 && <SummaryRow label="Photos" value={`${data.clinicImages.length} uploaded`} />}
        </div>
      </SummaryCard>

      <SummaryCard icon={Users} title="Doctors &amp; Services">
        <div className="space-y-2">
          <SummaryRow label="Default Fee" value={`₹${data.defaultFee}`} />
          <SummaryRow label="Doctors" value={`${data.doctors?.length ?? 0} added`} />
          {data.doctors?.map((doc, i) => (
            <div key={i} className="flex items-center gap-1.5 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <span className="text-[12px] text-slate-500 font-medium">{doc.name} — {doc.specialization}</span>
            </div>
          ))}
          {(data.services?.length ?? 0) > 0 && <SummaryRow label="Services" value={`${data.services.length} added`} />}
        </div>
      </SummaryCard>

      <SummaryCard icon={FileCheck} title="Verification">
        <div className="space-y-2">
          <SummaryRow label="Registration No." value={data.registrationNumber} />
          <SummaryRow label="Certificates" value={`${data.certificates?.length ?? 0} uploaded`} />
        </div>
      </SummaryCard>

      {/* Info */}
      <div className="flex items-start gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/15">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
          By submitting, you confirm all information is accurate and agree to our <span className="font-bold text-slate-800">Terms of Service</span>. Your clinic will be live once verified by our team.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-[14px] disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onSubmit} disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20 text-[15px] flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit Registration →'}
        </button>
      </div>
    </div>
  );
}
