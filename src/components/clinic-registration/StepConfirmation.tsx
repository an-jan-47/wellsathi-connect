import { useEffect, useState } from 'react';
import { Check, Loader2, Building2, User, MapPin, Users, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ClinicRegistrationData } from '@/types/clinic-registration';
import { cn } from '@/lib/utils';

interface StepConfirmationProps {
  data: ClinicRegistrationData;
  isSubmitting: boolean;
  isSuccess: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function StepConfirmation({ 
  data, 
  isSubmitting, 
  isSuccess,
  onBack, 
  onSubmit 
}: StepConfirmationProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard/clinic');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  if (isSuccess) {
    return (
      <div className="text-center py-12 animate-scale-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Registration Submitted!
        </h2>
        <p className="text-muted-foreground mb-6">
          Your clinic registration is pending admin approval. We'll notify you once approved.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard in <span className="font-semibold text-primary">{countdown}</span> seconds...
        </p>
        <Button 
          onClick={() => navigate('/dashboard/clinic')} 
          className="mt-4"
        >
          Go to Dashboard Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Review & Confirm</h2>
        <p className="text-muted-foreground mt-2">
          Please review your information before submitting
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Account Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{data.ownerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{data.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2 font-medium">{data.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Clinic Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Clinic Name:</span>
                <span className="ml-2 font-medium">{data.clinicName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-2 font-medium">{data.city}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>
                <span className="ml-2 font-medium">{data.address}</span>
              </div>
              {data.clinicImages.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Photos:</span>
                  <span className="ml-2 font-medium">{data.clinicImages.length} uploaded</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctors & Services */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Doctors & Services</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Default Fee:</span>
                <span className="ml-2 font-medium">₹{data.defaultFee}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Doctors:</span>
                <span className="ml-2 font-medium">{data.doctors.length} added</span>
              </div>
              {data.doctors.map((doc, i) => (
                <div key={i} className="ml-4 text-xs text-muted-foreground">
                  • {doc.name} - {doc.specialization}
                </div>
              ))}
              {data.services.length > 0 && (
                <>
                  <div>
                    <span className="text-muted-foreground">Services:</span>
                    <span className="ml-2 font-medium">{data.services.length} added</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Verification</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Registration No:</span>
                <span className="ml-2 font-medium">{data.registrationNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Certificates:</span>
                <span className="ml-2 font-medium">{data.certificates.length} uploaded</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-muted-foreground text-center">
        By submitting, you agree to our Terms of Service and confirm that all 
        information provided is accurate and complete.
      </p>

      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          className="flex-1"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          onClick={onSubmit} 
          className="flex-1" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </Button>
      </div>
    </div>
  );
}
