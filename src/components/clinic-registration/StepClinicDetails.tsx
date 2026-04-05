import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useCallback, useState, lazy, Suspense } from 'react';
import { clinicDetailsSchema, type ClinicDetailsData } from '@/types/clinic-registration';
import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';

const LeafletMapPicker = lazy(() =>
  import('./LeafletMapPicker').then(m => ({ default: m.LeafletMapPicker }))
);

interface Props {
  data: Partial<ClinicDetailsData>;
  userId: string;
  onNext: (data: ClinicDetailsData) => void;
  onBack: () => void;
}

const inputCls = (hasError?: boolean) =>
  `w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl text-[14px] font-medium outline-none transition-colors ${hasError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-primary'}`;

const textareaCls = (hasError?: boolean) =>
  `w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl text-[14px] font-medium outline-none transition-colors resize-none min-h-[90px] ${hasError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-primary'}`;

export function StepClinicDetails({ data, userId, onNext, onBack }: Props) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(data.clinicImages || []);
  const { uploadMultiple, isUploading } = useFileUpload({ bucket: 'clinic-images', maxSizeMB: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ClinicDetailsData>({
    resolver: zodResolver(clinicDetailsSchema),
    defaultValues: { clinicName: data.clinicName || '', city: data.city || '', address: data.address || '', description: data.description || '', clinicImages: data.clinicImages || [] },
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const results = await uploadMultiple(files, userId);
    const updated = [...uploadedImages, ...results.map(r => r.url)];
    setUploadedImages(updated); setValue('clinicImages', updated);
  }, [uploadMultiple, userId, uploadedImages, setValue]);

  const handleRemoveImage = useCallback((index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated); setValue('clinicImages', updated);
  }, [uploadedImages, setValue]);

  const handleLocationSelect = useCallback((loc: { lat: number; lng: number; address: string; city: string }) => {
    if (loc.city) setValue('city', loc.city);
    if (loc.address) setValue('address', loc.address);
  }, [setValue]);

  return (
    <form onSubmit={handleSubmit(d => onNext({ ...d, clinicImages: uploadedImages }))} className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-[26px] font-black text-slate-900">Clinic Details</h2>
        <p className="text-slate-400 font-medium mt-1 text-[14px]">Tell us about your clinic and its location.</p>
      </div>

      {/* Clinic Name */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Clinic Name</label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input id="clinicName" placeholder="Sunrise Medical Centre" className={inputCls(!!errors.clinicName)} {...register('clinicName')} />
        </div>
        {errors.clinicName && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.clinicName.message}</p>}
      </div>

      {/* Map */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Pin Location on Map</label>
        <div className="rounded-2xl overflow-hidden border-2 border-slate-100">
          <Suspense fallback={<div className="h-[260px] bg-slate-50 flex items-center justify-center text-[13px] text-slate-400 font-medium">Loading map…</div>}>
            <LeafletMapPicker onLocationSelect={handleLocationSelect} />
          </Suspense>
        </div>
      </div>

      {/* City */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">City</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input id="city" placeholder="Mumbai" className={inputCls(!!errors.city)} {...register('city')} />
        </div>
        {errors.city && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.city.message}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Full Address</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
          <textarea id="address" placeholder="123 Health Street, Andheri West…" className={textareaCls(!!errors.address)} {...register('address')} />
        </div>
        {errors.address && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.address.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Description <span className="font-medium text-slate-400">(Optional)</span></label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
          <textarea id="description" placeholder="Tell patients about your clinic, specialities, and what makes you unique…" className={textareaCls()} {...register('description')} />
        </div>
      </div>

      {/* Images */}
      <FileUploadZone
        label="Clinic Photos (Optional)"
        description="Upload up to 5 photos of your clinic"
        accept="image/jpeg,image/png,image/webp"
        maxFiles={5}
        uploadedUrls={uploadedImages}
        onFilesSelected={handleFilesSelected}
        onRemove={handleRemoveImage}
        isUploading={isUploading}
      />

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-[14px]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" disabled={isUploading}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20 text-[15px] flex items-center justify-center gap-2">
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />} Continue →
        </button>
      </div>
    </form>
  );
}
