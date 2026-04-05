import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Stethoscope, FileCheck, Users } from 'lucide-react';
import { ProgressSteps } from './ProgressSteps';
import { StepUserAccount } from './StepUserAccount';
import { StepClinicDetails } from './StepClinicDetails';
import { StepDoctorsServices } from './StepDoctorsServices';
import { StepCertificates } from './StepCertificates';
import { StepConfirmation } from './StepConfirmation';
import { useClinicRegistration } from '@/hooks/useClinicRegistration';
import type { ClinicRegistrationData } from '@/types/clinic-registration';

const BENEFITS = [
  { icon: Users, text: 'Reach thousands of patients in your area' },
  { icon: Stethoscope, text: 'Smart appointment & slot management' },
  { icon: CheckCircle2, text: 'Verified clinic badge builds trust' },
  { icon: FileCheck, text: 'Analytics dashboard for growth insights' },
];

export function MultiStepClinicRegistration() {
  const {
    currentStep, steps, formData, userId, isSubmitting, isSuccess,
    isLoggedIn, handleUserAccountSubmit, handleClinicDetailsSubmit,
    handleDoctorsServicesSubmit, handleCertificatesSubmit, handleFinalSubmit, goBack,
  } = useClinicRegistration();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm shrink-0">
        <div className="container max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.ico" className="w-8 h-8 rounded-xl" alt="WellSathi" />
            <span className="text-[18px] font-black text-slate-900">WellSathi</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Left info panel (desktop only) ── */}
        <aside className="hidden lg:flex lg:w-[380px] xl:w-[420px] shrink-0 bg-gradient-to-br from-primary to-primary/80 flex-col justify-between p-10 sticky top-0 h-[calc(100vh-64px)]">
          <div>
            <div className="w-14 h-14 rounded-[18px] bg-white/20 flex items-center justify-center mb-8">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[28px] font-black text-white leading-tight mb-3">
              Register Your Clinic
            </h2>
            <p className="text-white/70 font-medium text-[15px] leading-relaxed mb-10">
              Join WellSathi's network of trusted healthcare providers and grow your practice digitally.
            </p>
            <div className="space-y-5">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <b.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[14px] font-semibold text-white/85">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-[12px] font-medium">© {new Date().getFullYear()} WellSathi. All rights reserved.</p>
        </aside>

        {/* ── Right form area ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto px-4 py-10">
            {/* Progress steps */}
            <div className="mb-8">
              <ProgressSteps steps={steps} currentStep={currentStep} />
            </div>

            {/* Form card */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 md:p-10">
              {currentStep === 1 && !isLoggedIn && (
                <StepUserAccount data={formData} onNext={handleUserAccountSubmit} />
              )}
              {currentStep === 2 && userId && (
                <StepClinicDetails data={formData} userId={userId} onNext={handleClinicDetailsSubmit} onBack={goBack} />
              )}
              {currentStep === 3 && (
                <StepDoctorsServices data={formData} onNext={handleDoctorsServicesSubmit} onBack={goBack} />
              )}
              {currentStep === 4 && userId && (
                <StepCertificates data={formData} userId={userId} onNext={handleCertificatesSubmit} onBack={goBack} />
              )}
              {currentStep === 5 && (
                <StepConfirmation
                  data={formData as ClinicRegistrationData}
                  isSubmitting={isSubmitting}
                  isSuccess={isSuccess}
                  onBack={goBack}
                  onSubmit={handleFinalSubmit}
                />
              )}
            </div>

            {/* Login link */}
            {currentStep === 1 && !isLoggedIn && (
              <p className="text-center text-[13px] font-medium text-slate-400 mt-6">
                Already have an account?{' '}
                <Link to="/auth" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
