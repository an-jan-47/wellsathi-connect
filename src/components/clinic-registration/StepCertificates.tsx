import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileCheck, Hash } from 'lucide-react';
import { useCallback, useState } from 'react';
import { certificatesSchema, type CertificatesData } from '@/types/clinic-registration';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface StepCertificatesProps {
  data: Partial<CertificatesData>;
  userId: string;
  onNext: (data: CertificatesData) => void;
  onBack: () => void;
}

export function StepCertificates({ data, userId, onNext, onBack }: StepCertificatesProps) {
  const [uploadedCerts, setUploadedCerts] = useState<string[]>(data.certificates || []);
  
  const { uploadMultiple, isUploading } = useFileUpload({
    bucket: 'clinic-certificates',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    folder: 'certificates',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CertificatesData>({
    resolver: zodResolver(certificatesSchema),
    defaultValues: {
      registrationNumber: data.registrationNumber || '',
      certificates: data.certificates || [],
    },
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const results = await uploadMultiple(files, userId);
    const newPaths = results.map(r => r.path);
    const updated = [...uploadedCerts, ...newPaths];
    setUploadedCerts(updated);
    setValue('certificates', updated, { shouldValidate: true });
  }, [uploadMultiple, userId, uploadedCerts, setValue]);

  const handleRemoveCert = useCallback((index: number) => {
    const updated = uploadedCerts.filter((_, i) => i !== index);
    setUploadedCerts(updated);
    setValue('certificates', updated, { shouldValidate: true });
  }, [uploadedCerts, setValue]);

  const onSubmit = (formData: CertificatesData) => {
    onNext({ ...formData, certificates: uploadedCerts });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Verification Documents</h2>
        <p className="text-muted-foreground mt-2">
          Upload your clinic registration and certificates
        </p>
      </div>

      <div className="space-y-4">
        {/* Registration Number */}
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Clinic Registration Number</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="registrationNumber"
              placeholder="e.g., MH/MED/2024/12345"
              className={cn('pl-10', errors.registrationNumber && 'border-destructive')}
              {...register('registrationNumber')}
            />
          </div>
          {errors.registrationNumber && (
            <p className="text-sm text-destructive">{errors.registrationNumber.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            This is the registration number issued by your state medical council
          </p>
        </div>

        {/* Certificates Upload */}
        <div className="space-y-2">
          <FileUploadZone
            label="Upload Certificates"
            description="Upload clinic registration certificate, doctor licenses, or other relevant documents (PDF or images)"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            maxFiles={10}
            uploadedUrls={uploadedCerts}
            onFilesSelected={handleFilesSelected}
            onRemove={handleRemoveCert}
            isUploading={isUploading}
            showPreviews={true}
          />
          {errors.certificates && (
            <p className="text-sm text-destructive">{errors.certificates.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-accent/50 border border-accent-foreground/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Document Security</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your documents are encrypted and stored securely. They are only accessible to 
                authorized administrators for verification purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isUploading}>
          Continue
        </Button>
      </div>
    </form>
  );
}
