import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, MoreVertical, AtSign, Loader2, ArrowUpDown, Filter, Upload, Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { processDoctorImage } from '@/utils/imageProcessor';
import type { Doctor } from '@/types';

interface Props {
  clinicId: string;
}

export function ClinicDoctors({ clinicId }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({ 
    name: '', 
    specialization: '', 
    bio: '',
    fee: 0,
    experience: 0,
    email: '',
    image: null as File | null,
    previewUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const specialtiesOptions = [
    'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', 
    'Dermatology', 'Orthopedics', 'Psychiatry', 'Dentistry', 
    'Gynecology', 'ENT', 'Ophthalmology', 'Ayurveda', 'Physiotherapy', 'General Surgery'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [clinicId]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId);
      
      if (error) throw error;
      
      // Case-insensitive, locale-aware, stable sorting by name A-Z
      const sorted = ((data as Doctor[]) || []).sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      setDoctors(sorted);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm(f => ({ ...f, image: file, previewUrl: URL.createObjectURL(file) }));
    }
  };

  const uploadDoctorImage = async (file: File, doctorId: string): Promise<string> => {
    const processedBlob = await processDoctorImage(file);
    const formData = new FormData();
    formData.append('image', processedBlob, 'profile.webp');
    formData.append('doctor_id', doctorId);

    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shwunuijjtjctwfeaxmr.supabase.co';

    const response = await fetch(`${supabaseUrl}/functions/v1/process-doctor-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to process image');
    }

    const data = await response.json();

    return data.url;
  };

  const saveDoctor = async () => {
    if (!form.name.trim() || !form.specialization.trim()) {
      toast.error('Name and specialization are required');
      return;
    }
    if (form.fee < 0 || form.experience < 0) {
      toast.error('Fee and experience must be non-negative');
      return;
    }
    
    setIsSaving(true);
    try {
      let newImageUrl = editingId ? doctors.find(d => d.id === editingId)?.image_url : null;
      let doctorId = editingId;

      // 1. Database operation first
      const doctorData = {
        clinic_id: clinicId,
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        bio: form.bio.trim() || null,
        fee: form.fee,
        experience_years: form.experience,
        email_id: form.email.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase.from('doctors').update(doctorData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('doctors').insert(doctorData).select('id').single();
        if (error) throw error;
        doctorId = data.id;
      }

      // 2. Upload image if provided
      if (form.image && doctorId) {
        toast.info('Processing and uploading image...');
        newImageUrl = await uploadDoctorImage(form.image, doctorId);
        
        // Update record with the new URL
        if (newImageUrl) {
          const { error: urlError } = await supabase.from('doctors').update({ image_url: newImageUrl }).eq('id', doctorId);
          if (urlError) throw urlError;
        }
      }

      toast.success(editingId ? 'Doctor updated' : 'Doctor added');
      setDialogOpen(false);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save doctor');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      toast.success('Doctor removed');
      fetchDoctors();
    } catch {
      toast.error('Failed to remove doctor');
    }
  };

  const startEdit = (doc: Doctor) => {
    setEditingId(doc.id);
    setForm({ 
      name: doc.name, 
      specialization: doc.specialization, 
      bio: doc.bio || '',
      fee: doc.fee || 0,
      experience: doc.experience_years || 0,
      email: doc.email_id || '',
      image: null,
      previewUrl: doc.image_url || ''
    });
    setDialogOpen(true);
  };

  const handleManageSchedule = (doctorId: string) => {
    navigate(`?tab=slots&doctor=${doctorId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-1">
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Doctors Directory</h2>
          <p className="text-slate-500 mt-2 font-medium text-[15px] max-w-xl">Manage medical professionals, their specializations, and weekly clinical schedules.</p>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 sm:p-7 relative group hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-300">
            {/* Action Buttons Top Right */}
            <div className="absolute top-6 right-6 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(doc)} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
                <Edit2 className="w-[18px] h-[18px]" strokeWidth={2.5}/>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-700 transition-colors p-1"><MoreVertical className="w-5 h-5" strokeWidth={2.5}/></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl w-40">
                  <DropdownMenuItem onClick={() => deleteDoctor(doc.id)} className="text-destructive font-bold cursor-pointer py-2.5">
                    Remove Doctor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Avatar & Info */}
            <div className="mb-5">
              <div className="relative inline-block mb-4">
                {doc.image_url ? (
                  <img src={doc.image_url} alt={doc.name} loading="lazy" decoding="async" className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                     <span className="text-2xl font-black text-slate-400">{doc.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                {/* Active Green Dot Badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{doc.name}</h3>
              <p className="text-[13px] font-bold text-[#00a88f]">{doc.specialization}</p>
            </div>

            <div className="space-y-3 mb-6">
              {doc.email_id && (
                <div className="flex items-center gap-2.5 text-slate-500 font-medium text-[13px]">
                  <AtSign className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{doc.email_id}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-auto">
              <button onClick={() => handleManageSchedule(doc.id)} className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[13px] rounded-xl transition-colors min-w-0 truncate px-2">
                Manage Schedule
              </button>
            </div>
          </div>
        ))}

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { 
          setDialogOpen(o); 
          if (!o && !editingId) setForm({ name: '', specialization: '', bio: '', fee: 0, experience: 0, email: '', image: null, previewUrl: '' });
          if (!o) setEditingId(null);
        }}>
          <DialogTrigger asChild>
             <button className="bg-[#f2fcfb] rounded-[24px] border-2 border-dashed border-[#8ce3d6] p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] hover:bg-[#e6fbf8] hover:border-primary transition-all group">
               <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center mb-5 shadow-lg shadow-primary/50/30 group-hover:scale-110 transition-transform">
                 <Plus className="w-7 h-7" strokeWidth={3} />
               </div>
               <h4 className="text-[17px] font-black text-slate-900 mb-1.5 tracking-tight">Add New Professional</h4>
               <p className="text-[13px] text-[#00a88f] font-medium max-w-[200px]">Register a new specialist to clinic</p>
             </button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl p-6 md:p-8 border-slate-100 shadow-2xl max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-slate-900">{editingId ? 'Edit Professional' : 'Add Professional'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Image Upload Section - Span full row */}
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center mb-2">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#006b5f] hover:bg-slate-100 transition-colors overflow-hidden group shadow-sm">
                  {form.previewUrl ? (
                    <img src={form.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400 mb-1 group-hover:text-slate-900" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload</span>
                    </>
                  )}
                  {form.previewUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-3 text-center">Max 2MB. JPG, PNG, WEBP.</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Sarah Jenkins" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20" />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Specialization *</label>
                <Select value={form.specialization} onValueChange={(val) => setForm({ ...form, specialization: val })}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[200px]">
                    {specialtiesOptions.map(spec => (
                      <SelectItem key={spec} value={spec} className="font-medium cursor-pointer rounded-lg my-0.5">{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Fee (₹) *</label>
                <Input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: parseInt(e.target.value) || 0 })} placeholder="500" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20" />
              </div>

              <div>
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Exp. (Years) *</label>
                <Input type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} placeholder="5" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@clinic.com" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bio</label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Brief background about the professional..." className="min-h-[100px] bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-[#006b5f] focus:ring-[#006b5f]/20 resize-none" />
              </div>
            </div>
            
            <div className="mt-6">
              <Button className="w-full py-6 bg-[#006b5f] hover:bg-[#005048] text-white rounded-xl font-bold shadow-lg" onClick={saveDoctor} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {editingId ? 'Save Changes' : 'Register Professional'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>


    </div>
  );
}
