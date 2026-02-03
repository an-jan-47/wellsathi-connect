import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, FileText } from 'lucide-react';
import { useCallback, useState } from 'react';
import { clinicDetailsSchema, type ClinicDetailsData } from '@/types/clinic-registration';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface StepClinicDetailsProps {
  data: Partial<ClinicDetailsData>;
  userId: string;
  onNext: (data: ClinicDetailsData) => void;
  onBack: () => void;
}

export function StepClinicDetails({ data, userId, onNext, onBack }: StepClinicDetailsProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(data.clinicImages || []);
  
  const { uploadMultiple, isUploading } = useFileUpload({
    bucket: 'clinic-images',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ClinicDetailsData>({
    resolver: zodResolver(clinicDetailsSchema),
    defaultValues: {
      clinicName: data.clinicName || '',
      city: data.city || '',
      address: data.address || '',
      description: data.description || '',
      clinicImages: data.clinicImages || [],
    },
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const results = await uploadMultiple(files, userId);
    const newUrls = results.map(r => r.url);
    const updated = [...uploadedImages, ...newUrls];
    setUploadedImages(updated);
    setValue('clinicImages', updated);
  }, [uploadMultiple, userId, uploadedImages, setValue]);

  const handleRemoveImage = useCallback((index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    setValue('clinicImages', updated);
  }, [uploadedImages, setValue]);

  const onSubmit = (formData: ClinicDetailsData) => {
    onNext({ ...formData, clinicImages: uploadedImages });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Clinic Details</h2>
        <p className="text-muted-foreground mt-2">
          Tell us about your clinic
        </p>
      </div>

      <div className="space-y-4">
        {/* Clinic Name */}
        <div className="space-y-2">
          <Label htmlFor="clinicName">Clinic Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="clinicName"
              placeholder="City Health Clinic"
              className={cn('pl-10', errors.clinicName && 'border-destructive')}
              {...register('clinicName')}
            />
          </div>
          {errors.clinicName && (
            <p className="text-sm text-destructive">{errors.clinicName.message}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              placeholder="Mumbai"
              className={cn('pl-10', errors.city && 'border-destructive')}
              {...register('city')}
            />
          </div>
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Full Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="address"
              placeholder="123 Main Street, Near City Hospital..."
              className={cn('pl-10 min-h-[80px]', errors.address && 'border-destructive')}
              {...register('address')}
            />
          </div>
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="description"
              placeholder="Tell patients about your clinic, services, and expertise..."
              className="pl-10 min-h-[100px]"
              {...register('description')}
            />
          </div>
        </div>

        {/* Clinic Images */}
        <FileUploadZone
          label="Clinic Photos (Optional)"
          description="Upload photos of your clinic (max 5)"
          accept="image/jpeg,image/png,image/webp"
          maxFiles={5}
          uploadedUrls={uploadedImages}
          onFilesSelected={handleFilesSelected}
          onRemove={handleRemoveImage}
          isUploading={isUploading}
        />
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
