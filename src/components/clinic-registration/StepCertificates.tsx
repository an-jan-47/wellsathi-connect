import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { certificatesSchema, type CertificatesData } from '@/types/clinic-registration';
import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';

interface Props { data: Partial<CertificatesData>; userId: string; onNext: (data: CertificatesData) => void; onBack: () => void; }

export function StepCertificates({ data, userId, onNext, onBack }: Props) {
  const [uploadedCerts, setUploadedCerts] = useState<string[]>(data.certificates || []);
  const { uploadMultiple, isUploading } = useFileUpload({ bucket: 'clinic-certificates', maxSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], folder: 'certificates' });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CertificatesData>({
    resolver: zodResolver(certificatesSchema),
    defaultValues: { registrationNumber: data.registrationNumber || '', certificates: data.certificates || [] },
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const results = await uploadMultiple(files, userId);
    const updated = [...uploadedCerts, ...results.map(r => r.url)];
    setUploadedCerts(updated); setValue('certificates', updated, { shouldValidate: true });
  }, [uploadMultiple, userId, uploadedCerts, setValue]);

  const handleRemoveCert = useCallback((index: number) => {
    const updated = uploadedCerts.filter((_, i) => i !== index);
    setUploadedCerts(updated); setValue('certificates', updated, { shouldValidate: true });
  }, [uploadedCerts, setValue]);

  return (
    <form onSubmit={handleSubmit(d => onNext({ ...d, certificates: uploadedCerts }))} className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-[26px] font-black text-slate-900">Verification Documents</h2>
        <p className="text-slate-400 font-medium mt-1 text-[14px]">Upload your clinic registration certificate and relevant documents.</p>
      </div>

      {/* Reg number */}
      <div>
        <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">Clinic Registration Number</label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input id="registrationNumber" placeholder="e.g., MH/MED/2024/12345"
            className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl text-[14px] font-medium outline-none transition-colors ${errors.registrationNumber ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-primary'}`}
            {...register('registrationNumber')} />
        </div>
        {errors.registrationNumber && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.registrationNumber.message}</p>}
        <p className="text-[11px] text-slate-400 font-medium mt-1.5">Issued by your state medical council</p>
      </div>

      {/* Upload */}
      <FileUploadZone
        label="Upload Certificates"
        description="Registration certificate, doctor licences, or other documents (PDF or images, max 10 files)"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        maxFiles={10}
        uploadedUrls={uploadedCerts}
        onFilesSelected={handleFilesSelected}
        onRemove={handleRemoveCert}
        isUploading={isUploading}
        showPreviews={true}
      />
      {errors.certificates && <p className="text-[12px] text-red-500 font-medium">{errors.certificates.message}</p>}

      {/* Security note */}
      <div className="flex items-start gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/15">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-extrabold text-slate-800">Encrypted &amp; Secure</p>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">Your documents are encrypted and only accessible to authorised administrators for verification.</p>
        </div>
      </div>

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
