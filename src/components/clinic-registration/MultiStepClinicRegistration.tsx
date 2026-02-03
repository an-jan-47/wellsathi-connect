import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { ProgressSteps } from './ProgressSteps';
import { StepUserAccount } from './StepUserAccount';
import { StepClinicDetails } from './StepClinicDetails';
import { StepDoctorsServices } from './StepDoctorsServices';
import { StepCertificates } from './StepCertificates';
import { StepConfirmation } from './StepConfirmation';
import { useClinicRegistration } from '@/hooks/useClinicRegistration';
import type { ClinicRegistrationData } from '@/types/clinic-registration';

export function MultiStepClinicRegistration() {
  const {
    currentStep,
    steps,
    formData,
    userId,
    isSubmitting,
    isSuccess,
    handleUserAccountSubmit,
    handleClinicDetailsSubmit,
    handleDoctorsServicesSubmit,
    handleCertificatesSubmit,
    handleFinalSubmit,
    goBack,
  } = useClinicRegistration();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
            <Building2 className="h-6 w-6" />
            <span>WellSathi</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </div>

        {/* Form Container */}
        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-2xl shadow-medium border border-border/50 p-6 md:p-8">
            {currentStep === 1 && (
              <StepUserAccount
                data={formData}
                onNext={handleUserAccountSubmit}
              />
            )}

            {currentStep === 2 && userId && (
              <StepClinicDetails
                data={formData}
                userId={userId}
                onNext={handleClinicDetailsSubmit}
                onBack={goBack}
              />
            )}

            {currentStep === 3 && (
              <StepDoctorsServices
                data={formData}
                onNext={handleDoctorsServicesSubmit}
                onBack={goBack}
              />
            )}

            {currentStep === 4 && userId && (
              <StepCertificates
                data={formData}
                userId={userId}
                onNext={handleCertificatesSubmit}
                onBack={goBack}
              />
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

          {/* Login Link */}
          {currentStep === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
