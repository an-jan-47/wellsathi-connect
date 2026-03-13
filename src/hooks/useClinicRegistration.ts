import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import type { 
  ClinicRegistrationData, 
  UserAccountData, 
  ClinicDetailsData, 
  DoctorsServicesData, 
  CertificatesData 
} from '@/types/clinic-registration';

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account' },
  { id: 2, title: 'Clinic', description: 'Clinic details' },
  { id: 3, title: 'Doctors', description: 'Add your team' },
  { id: 4, title: 'Documents', description: 'Upload certificates' },
  { id: 5, title: 'Confirm', description: 'Review & submit' },
];

export function useClinicRegistration() {
  const { user, profile } = useAuthStore();
  const isLoggedIn = !!user;
  const [currentStep, setCurrentStep] = useState(isLoggedIn ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(user?.id ?? null);

  // If user logs in while on step 1, auto-advance
  useEffect(() => {
    if (user && currentStep === 1) {
      setUserId(user.id);
      setFormData(prev => ({
        ...prev,
        ownerName: profile?.name || '',
        email: user.email || '',
        phone: profile?.phone || '',
      }));
      setCurrentStep(2);
    }
  }, [user, profile]);
  
  // Form data across all steps
  const [formData, setFormData] = useState<Partial<ClinicRegistrationData>>({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    clinicName: '',
    city: '',
    address: '',
    description: '',
    clinicImages: [],
    doctors: [],
    services: [],
    defaultFee: 500,
    registrationNumber: '',
    certificates: [],
  });

  const handleUserAccountSubmit = useCallback(async (data: UserAccountData) => {
    setIsSubmitting(true);
    
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: data.ownerName,
            phone: data.phone,
            is_clinic_owner: true,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Store user ID for file uploads
      setUserId(authData.user.id);

      // Update form data and move to next step
      setFormData(prev => ({
        ...prev,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }));
      
      setCurrentStep(2);
      
      toast({
        title: 'Account Created',
        description: 'Please check your email to verify your account.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleClinicDetailsSubmit = useCallback((data: ClinicDetailsData) => {
    setFormData(prev => ({
      ...prev,
      clinicName: data.clinicName,
      city: data.city,
      address: data.address,
      description: data.description,
      clinicImages: data.clinicImages,
    }));
    setCurrentStep(3);
  }, []);

  const handleDoctorsServicesSubmit = useCallback((data: DoctorsServicesData) => {
    setFormData(prev => ({
      ...prev,
      doctors: data.doctors.map(d => ({
        name: d.name,
        specialization: d.specialization,
        fee: d.fee,
      })),
      services: data.services.map(s => ({
        serviceName: s.serviceName,
        fee: s.fee,
      })),
      defaultFee: data.defaultFee,
    }));
    setCurrentStep(4);
  }, []);

  const handleCertificatesSubmit = useCallback((data: CertificatesData) => {
    setFormData(prev => ({
      ...prev,
      registrationNumber: data.registrationNumber,
      certificates: data.certificates,
    }));
    setCurrentStep(5);
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Session expired. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for edge function
      const payload = {
        clinicDetails: {
          name: formData.clinicName!,
          address: formData.address!,
          city: formData.city!,
          phone: formData.phone,
          description: formData.description,
          fees: formData.defaultFee || 500,
          specializations: formData.doctors?.map(d => d.specialization) || [],
          images: formData.clinicImages || [],
          certificates: formData.certificates || [],
          registration_number: formData.registrationNumber,
        },
        doctors: formData.doctors,
        services: formData.services
      };

      // Call secure Edge Function for transaction-like inserting
      const { data, error: functionError } = await supabase.functions.invoke('register-clinic', {
        body: payload
      });

      if (functionError) {
        let errorMessage = functionError.message || 'Edge Function failed';
        try {
          if (functionError.context && typeof functionError.context.json === 'function') {
            const body = await functionError.context.json();
            errorMessage = body.error || errorMessage;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setIsSuccess(true);

      // Refresh auth store roles so dashboard access check passes immediately
      const { useAuthStore } = await import('@/stores/authStore');
      if (userId) {
        await useAuthStore.getState().fetchUserData(userId);
      }
      
      toast({
        title: 'Registration Complete!',
        description: 'Your clinic has been registered and is pending approval.',
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to complete registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, formData]);

  const goBack = useCallback(() => {
    const minStep = isLoggedIn ? 2 : 1;
    setCurrentStep(prev => Math.max(minStep, prev - 1));
  }, [isLoggedIn]);

  return {
    currentStep,
    steps: STEPS,
    formData,
    userId,
    isSubmitting,
    isSuccess,
    isLoggedIn,
    handleUserAccountSubmit,
    handleClinicDetailsSubmit,
    handleDoctorsServicesSubmit,
    handleCertificatesSubmit,
    handleFinalSubmit,
    goBack,
  };
}
