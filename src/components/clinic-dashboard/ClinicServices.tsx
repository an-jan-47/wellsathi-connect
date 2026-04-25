import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Phone, Edit2, Wallet, Plus, CheckCircle2,
  Clock, ShieldCheck, Loader2, Stethoscope, MoreVertical
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const COMMON_SERVICES = [
  'General Consultation',
  'Specialist Consultation',
  'Follow-up Visit',
  'Vaccination',
  'Blood Test',
  'ECG',
  'X-Ray',
  'Ultrasound',
  'Dental Cleaning',
  'Root Canal',
  'Dental Filling',
  'Tooth Extraction',
  'Physiotherapy Session',
  'Health Checkup',
  'Full Body Checkup',
  'Online Consultation'
];

interface Service {
  id: string;
  clinic_id: string;
  service_name: string;
  fee: number;
}

interface Props {
  clinic: any;
  onUpdateClinic: () => void;
}

export function ClinicServices({ clinic, onUpdateClinic }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Service Dialog
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ serviceName: '', fee: 0 });

  // Clinic Edit Dialog
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [isSavingClinic, setIsSavingClinic] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: '', address: '', phone: '', fees: 0 });

  useEffect(() => {
    if (clinic) fetchServices();

    const handleOpenModal = () => openServiceCreate();
    window.addEventListener('open-add-service-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-service-modal', handleOpenModal);
  }, [clinic]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('service_name');
      if (error) throw error;
      setServices(data || []);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const saveService = async () => {
    if (!serviceForm.serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    setIsSavingService(true);
    try {
      if (editingServiceId) {
        const { error } = await supabase.from('clinic_services').update({
          service_name: serviceForm.serviceName.trim(),
          fee: serviceForm.fee,
        }).eq('id', editingServiceId);
        if (error) throw error;
        toast.success('Service updated');
      } else {
        const { error } = await supabase.from('clinic_services').insert({
          clinic_id: clinic.id,
          service_name: serviceForm.serviceName.trim(),
          fee: serviceForm.fee,
        });
        if (error) throw error;
        toast.success('Service added');
      }
      setServiceDialogOpen(false);
      fetchServices();
    } catch {
      toast.error('Failed to save service');
    } finally {
      setIsSavingService(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Service removed');
      fetchServices();
    } catch {
      toast.error('Failed to remove service');
    }
  };

  const openServiceEdit = (svc: Service) => {
    setEditingServiceId(svc.id);
    setServiceForm({ serviceName: svc.service_name, fee: svc.fee });
    setServiceDialogOpen(true);
  };

  const openServiceCreate = () => {
    setEditingServiceId(null);
    setServiceForm({ serviceName: '', fee: 0 });
    setServiceDialogOpen(true);
  };

  const openClinicEdit = () => {
    setClinicForm({
      name: clinic.name || '',
      address: clinic.address || '',
      phone: clinic.phone || '',
      fees: clinic.fees || 0
    });
    setClinicDialogOpen(true);
  };

  const saveClinicProfile = async () => {
    setIsSavingClinic(true);
    try {
      const { error } = await supabase.from('clinics').update({
        name: clinicForm.name.trim(),
        address: clinicForm.address.trim(),
        phone: clinicForm.phone.trim(),
        fees: clinicForm.fees,
      }).eq('id', clinic.id);
      if (error) throw error;
      toast.success('Clinic profile updated');
      setClinicDialogOpen(false);
      onUpdateClinic();
    } catch {
      toast.error('Failed to update clinic');
    } finally {
      setIsSavingClinic(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>;
  }

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-6 pl-1">
        <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">Clinic Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-[15px]">Manage your clinic details, consultation fees, and offered services.</p>
      </div>

      {/* Top Banner Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Profile Info */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
          <div className="w-[100px] h-[100px] bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm z-10">
            <Building2 className="w-10 h-10 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex-1 z-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">{clinic.name}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">{clinic.address || "No address provided"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">{clinic.phone || "No phone provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Fee Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-4 right-4">
             <button onClick={openClinicEdit} className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-50 dark:border-slate-600 opacity-0 group-hover:opacity-100">
               <Edit2 className="w-4 h-4" />
             </button>
          </div>
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-5">
            <Wallet className="w-6 h-6 text-primary" strokeWidth={2.5}/>
          </div>
          <h4 className="text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Consultation Fee</h4>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">₹{clinic.fees}</span>
            <span className="text-[14px] font-bold text-slate-400 dark:text-slate-500">/ session</span>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pl-1">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Clinic Services</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-1">Manage specialized treatments and services offered.</p>
          </div>
          <Button onClick={openServiceCreate} className="bg-[#006b5f] hover:bg-[#005048] text-white font-bold rounded-xl shadow-lg shadow-[#006b5f]/20 transition-all px-6 py-[22px]">
            <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
            Add New Service
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <div key={svc.id} className="bg-white dark:bg-slate-800 p-5 rounded-[20px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 group hover:shadow-md dark:hover:shadow-none transition-all relative">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight pr-6 truncate">{svc.service_name}</h4>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openServiceEdit(svc)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-700">
                        <MoreVertical className="w-4 h-4"/>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 dark:border-slate-700 dark:bg-slate-800 shadow-xl w-40">
                      <DropdownMenuItem onClick={() => deleteService(svc.id)} className="text-destructive font-bold cursor-pointer py-2">
                        Remove Service
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-widest text-slate-900/70 dark:text-slate-300 bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-md">Fee</span>
                <span className="text-[20px] font-black text-slate-900 dark:text-white">₹{svc.fee}</span>
              </div>
            </div>
          ))}

          {/* Add New Service Card */}
          <button onClick={openServiceCreate} className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-[20px] p-6 flex flex-col items-center justify-center min-h-[180px] group transition-colors">
             <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 group-hover:text-primary shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-600 mb-4 transition-colors">
               <Plus className="w-6 h-6" strokeWidth={2.5} />
             </div>
             <span className="text-[14px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Add New Service</span>
          </button>
        </div>
      </div>

      {/* Bottom Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div className="bg-primary/5 dark:bg-primary/10 rounded-[20px] p-6 flex items-start gap-4 border border-primary/10 dark:border-primary/20">
           <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2}/>
           <div>
             <h5 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-1">Certification Status</h5>
             <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Verified by local health department. Active until Dec 2026.</p>
           </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-[20px] p-6 flex items-start gap-4 border border-slate-100 dark:border-slate-700">
           <Clock className="w-6 h-6 text-slate-400 flex-shrink-0" strokeWidth={2}/>
           <div>
             <h5 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-1">Clinic Hours</h5>
             <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Standard operations: Mon - Sat, 09:00 AM - 19:00 PM.</p>
           </div>
        </div>
      </div>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="rounded-3xl p-8 border-slate-100 dark:border-slate-700 dark:bg-slate-800 shadow-2xl max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
              {editingServiceId ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Service Name</label>
              <Select value={serviceForm.serviceName} onValueChange={(val) => setServiceForm({ ...serviceForm, serviceName: val })}>
                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl dark:bg-slate-800 dark:border-slate-700">
                  {COMMON_SERVICES.map((name) => (
                    <SelectItem key={name} value={name} className="font-medium cursor-pointer py-2 dark:text-slate-200">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Service Fee (₹)</label>
              <Input type="number" min={0} value={serviceForm.fee} onChange={(e) => setServiceForm({ ...serviceForm, fee: parseInt(e.target.value) || 0 })} className="h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" />
            </div>
            <Button className="w-full py-6 mt-2 bg-[#006b5f] hover:bg-[#005048] text-white rounded-xl font-bold shadow-lg" onClick={saveService} disabled={isSavingService}>
              {isSavingService ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clinic Profile Dialog */}
      <Dialog open={clinicDialogOpen} onOpenChange={setClinicDialogOpen}>
        <DialogContent className="rounded-3xl p-8 border-slate-100 dark:border-slate-700 dark:bg-slate-800 shadow-2xl max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Edit Clinic Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Clinic Name</label>
              <Input value={clinicForm.name} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
              <Textarea value={clinicForm.address} onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })} rows={2} className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-medium dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Phone</label>
                <Input value={clinicForm.phone} onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Default Fee</label>
                <Input type="number" value={clinicForm.fees} onChange={(e) => setClinicForm({ ...clinicForm, fees: parseInt(e.target.value) || 0 })} className="h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" />
              </div>
            </div>
            <Button className="w-full py-6 mt-4 bg-[#006b5f] hover:bg-[#005048] text-white rounded-xl font-bold shadow-lg" onClick={saveClinicProfile} disabled={isSavingClinic}>
              {isSavingClinic ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
