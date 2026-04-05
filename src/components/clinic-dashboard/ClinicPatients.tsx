import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, UserPlus, Download, Plus, Search, ChevronLeft, ChevronRight, Star, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Props { clinicId: string; }

const patientSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')) as z.ZodType<string | undefined>,
  condition: z.string().optional(),
  status: z.enum(['new', 'follow_up', 'recovered', 'critical', 'in_treatment']).default('new')
});
type PatientForm = z.infer<typeof patientSchema>;

const STATUS_BADGES: Record<string, string> = {
  'new': 'bg-slate-100 text-slate-600',
  'follow_up': 'bg-blue-100 text-blue-600',
  'recovered': 'bg-emerald-100 text-emerald-600',
  'critical': 'bg-red-100 text-red-600',
  'in_treatment': 'bg-purple-100 text-purple-600'
};

const getAvatarColor = (name: string) => {
  const COLORS = ['bg-emerald-100 text-emerald-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

export function ClinicPatients({ clinicId }: Props) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('All Patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: { full_name: '', phone: '', email: '', condition: '', status: 'new' }
  });

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!clinicId) return;
    const channel = supabase.channel('patients-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_patients', filter: `clinic_id=eq.${clinicId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinic_patients', clinicId] });
        queryClient.invalidateQueries({ queryKey: ['clinic_stats', clinicId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId, queryClient]);

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['clinic_patients', clinicId, debouncedSearch, activeFilter, page, pageSize],
    queryFn: async () => {
      const statusQuery = activeFilter === 'All Patients' ? 'All Patients' : activeFilter.toLowerCase();
      const { data, error } = await supabase.rpc('get_clinic_patients_list', {
        p_clinic_id: clinicId, p_search: debouncedSearch, p_status: statusQuery, p_limit: pageSize, p_offset: (page - 1) * pageSize
      });
      if (error) throw error;
      const rows = (data as any[] | null) || [];
      return { data: rows, totalCount: rows[0]?.total_count || 0 };
    },
    enabled: !!clinicId,
  });

  const { data: stats } = useQuery({
    queryKey: ['clinic_stats', clinicId],
    queryFn: async () => {
      const [weeklyRes, reviewsRes] = await Promise.all([
        supabase.from('clinic_patients').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss'Z'")),
        supabase.from('reviews').select('rating').eq('clinic_id', clinicId)
      ]);
      let avgRating = 0;
      if (reviewsRes.data && reviewsRes.data.length > 0) {
         const sum = reviewsRes.data.reduce((a, b) => a + b.rating, 0);
         avgRating = sum / reviewsRes.data.length;
      }
      return { newThisWeek: weeklyRes.count || 0, rating: avgRating.toFixed(1), reviewCount: reviewsRes.data?.length || 0 };
    },
    enabled: !!clinicId
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PatientForm) => {
      if (editPatientId) {
         const { error } = await supabase.from('clinic_patients').update(data).eq('id', editPatientId);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('clinic_patients').insert({ clinic_id: clinicId, full_name: data.full_name!, phone: data.phone, email: data.email, condition: data.condition, status: data.status });
         if (error) throw error;
      }
    },
    onSuccess: () => { 
      toast.success('Patient record saved.'); 
      queryClient.invalidateQueries({ queryKey: ['clinic_patients', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['clinic_stats', clinicId] });
      closeModal(); 
    },
    onError: (error: any) => toast.error(error.message || 'Failed to save patient')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinic_patients').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { 
      toast.success('Patient securely archived.');
      queryClient.invalidateQueries({ queryKey: ['clinic_patients', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['clinic_stats', clinicId] });
    },
    onError: (error: any) => toast.error(error.message || 'Deletion failed')
  });

  const openAddModal = () => { setEditPatientId(null); reset({ full_name: '', phone: '', email: '', condition: '', status: 'new' }); setIsAddOpen(true); };
  const openEditModal = (p: any) => { setEditPatientId(p.id); reset({ full_name: p.full_name, phone: p.phone || '', email: p.email || '', condition: p.condition || '', status: p.status }); setIsAddOpen(true); };
  const closeModal = () => { setIsAddOpen(false); setTimeout(reset, 200); };

  const exportToCSV = () => {
    if (!patientsData?.data || patientsData.data.length === 0) return toast.error('No patients to export');
    const headers = ['Patient ID', 'Name', 'Phone', 'Email', 'Condition', 'Status', 'Last Visit', 'Next Appointment'];
    const csvContent = [headers.join(',')];
    patientsData.data.forEach((p: any) => {
      csvContent.push([p.id, `"${p.full_name}"`, `"${p.phone || ''}"`, `"${p.email || ''}"`, `"${p.condition || ''}"`, p.status, p.last_visit_date || '-', p.next_appointment_date || '-'].join(','));
    });
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `patients_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link); toast.success('Export triggered.');
  };

  const totalPatients = patientsData?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalPatients / pageSize));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Patients Directory</h2>
          <p className="text-slate-500 mt-2 font-medium text-[15px]">Manage patient records, medical history, and upcoming consultations.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[14px] rounded-xl shadow-sm transition-all">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export List</span>
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#00ba94] text-white font-bold text-[14px] rounded-xl shadow-lg shadow-primary/50/20 transition-all">
            <Plus className="w-4 h-4" strokeWidth={3} /> <span className="hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col justify-between h-[140px] relative overflow-hidden">
          <div className="flex justify-between items-start z-10"><span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest">Total Patients</span><div className="w-10 h-10 rounded-xl bg-[#ebfcf9] flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div></div>
          <div className="z-10 mt-auto"><h3 className="text-[32px] font-black text-slate-900 leading-none">{totalPatients}</h3></div>
        </div>
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col justify-between h-[140px] relative overflow-hidden">
          <div className="flex justify-between items-start z-10"><span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest">New This Week</span><div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center"><UserPlus className="w-5 h-5 text-blue-500" /></div></div>
          <div className="z-10 mt-auto"><h3 className="text-[32px] font-black text-slate-900 leading-none">{stats?.newThisWeek || 0}</h3></div>
        </div>
        <div className="bg-[#006b5f] rounded-[24px] shadow-[0_8px_25px_-5px_rgba(0,107,95,0.4)] border border-[#006b5f] p-6 flex flex-col justify-between h-[140px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-bl-full pointer-events-none -translate-y-10 translate-x-10"></div>
          <div className="z-10"><span className="text-[15px] font-extrabold text-white tracking-wide">Patient Satisfaction</span><p className="text-[13px] font-medium text-[#8dfbe3] mt-1 max-w-[80%] leading-snug">From {stats?.reviewCount || 0} real reviews.</p></div>
          <div className="z-10 mt-auto flex items-end gap-3"><h3 className="text-[32px] font-black text-white leading-none">{stats?.rating || '0.0'}</h3><Star className="w-6 h-6 text-amber-400 fill-amber-400 mb-1" /></div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="px-6 md:px-8 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 bg-[#fbfcfd]">
          <div className="relative w-full xl:max-w-xs"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, phone, condition..." className="w-full bg-white hover:bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#006b5f]/20 transition-all" /></div>
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">{['All Patients', 'New', 'Follow_up', 'Recovered', 'Critical'].map(filter => (<button key={filter} onClick={() => { setActiveFilter(filter); setPage(1); }} className={`px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{filter.replace('_', ' ')}</button>))}</div>
        </div>

        <div className="w-full overflow-x-auto min-h-[300px]">
          {isLoading ? (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>) : patientsData?.data?.length === 0 ? (<div className="flex flex-col items-center justify-center p-16 text-slate-400"><Users className="h-12 w-12 mb-4 opacity-20" /><p className="font-bold text-lg text-slate-500">No Patient Records</p></div>) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f7fb] text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]"><th className="px-6 md:px-8 py-5 min-w-[250px]">Patient Name</th><th className="px-6 py-5 min-w-[150px]">Last Visit</th><th className="px-6 py-5 min-w-[150px]">Upcoming</th><th className="px-6 py-5 min-w-[200px]">Contact & Status</th><th className="px-6 py-5 w-16"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patientsData?.data?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 md:px-8 py-5"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${getAvatarColor(p.full_name)}`}>{(p.full_name || '?').charAt(0).toUpperCase()}</div><div><h4 className="font-extrabold text-[15px] text-slate-900 line-clamp-1">{p.full_name}</h4><p className="text-[12px] font-bold text-slate-400 mt-0.5 line-clamp-1">{p.condition || 'No conditions logged'}</p></div></div></td>
                    <td className="px-6 py-5">{p.last_visit_date ? (<><p className="text-[14px] font-bold text-slate-700">{format(new Date(p.last_visit_date), 'MMM dd, yyyy')}</p><p className="text-[12px] font-bold text-slate-500 mt-0.5 line-clamp-1">{p.last_visit_purpose || 'General Consultation'}</p></>) : <span className="text-[14px] font-bold text-slate-300">-</span>}</td>
                    <td className="px-6 py-5">{p.next_appointment_date ? (<><p className="text-[14px] font-bold text-slate-900">{format(new Date(p.next_appointment_date), 'MMM dd, yyyy')}</p><p className="text-[12px] font-bold text-slate-900/70 mt-0.5">{p.next_appointment_time?.slice(0,5)}</p></>) : <span className="text-[13px] font-bold text-slate-400">None Scheduled</span>}</td>
                    <td className="px-6 py-5"><div className="flex items-center justify-between"><div><p className={`text-[14px] font-bold ${p.phone ? 'text-slate-700' : 'text-slate-300'}`}>{p.phone || 'No phone'}</p><p className={`text-[12px] font-bold mt-0.5 ${p.email ? 'text-slate-400' : 'text-slate-300'}`}>{p.email || 'No email'}</p></div><div className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${STATUS_BADGES[p.status.toLowerCase()] || STATUS_BADGES.new}`}>{p.status.replace('_', ' ')}</div></div></td>
                    <td className="px-6 py-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical className="w-5 h-5"/></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100"><DropdownMenuItem onClick={() => openEditModal(p)} className="font-bold py-2 cursor-pointer"><Edit2 className="w-4 h-4 mr-2 text-slate-400"/> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => { if(confirm('Soft delete this patient?')) deleteMutation.mutate(p.id); }} className="font-bold py-2 cursor-pointer text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2 opacity-70"/> Archive Record</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 md:px-8 py-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4"><p className="text-[13px] font-bold text-slate-400">Showing {(page-1)*pageSize + 1}-{Math.min(page*pageSize, totalPatients)} of {totalPatients}</p><Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}><SelectTrigger className="h-8 text-xs font-bold w-[90px] border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="10" className="text-xs font-bold">10 / pg</SelectItem><SelectItem value="20" className="text-xs font-bold">20 / pg</SelectItem><SelectItem value="50" className="text-xs font-bold">50 / pg</SelectItem></SelectContent></Select></div>
          <div className="flex items-center gap-1"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 rounded-lg"><ChevronLeft className="w-4 h-4" /></button><span className="px-3 text-sm font-black text-slate-700">Pg {page}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 rounded-lg"><ChevronRight className="w-4 h-4" /></button></div>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md rounded-[24px] p-8 border-slate-100 shadow-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-2xl font-black text-slate-900">{editPatientId ? 'Modify Patient' : 'Register Patient'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label><Input {...register('full_name')} className="h-12 bg-slate-50 border-slate-200 font-semibold rounded-xl" placeholder="eg. Sarah Jenkins" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Phone Number</label><Input {...register('phone')} className="h-12 bg-slate-50 border-slate-200 font-semibold rounded-xl" /></div>
              <div><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label><Input {...register('email')} className="h-12 bg-slate-50 border-slate-200 font-semibold rounded-xl" type="email" /></div>
            </div>
            <div><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Known Condition</label><Input {...register('condition')} className="h-12 bg-slate-50 border-slate-200 font-semibold rounded-xl" placeholder="eg. Chronic Asthma" /></div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Treatment Status</label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-semibold rounded-xl capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="new" className="font-bold py-2">New</SelectItem><SelectItem value="follow_up" className="font-bold py-2">Follow Up</SelectItem><SelectItem value="recovered" className="font-bold py-2">Recovered</SelectItem><SelectItem value="in_treatment" className="font-bold py-2">In Treatment</SelectItem><SelectItem value="critical" className="font-bold py-2">Critical</SelectItem></SelectContent>
                </Select>
              )} />
            </div>
            <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="w-full h-14 bg-primary hover:bg-[#00ba94] text-white font-bold rounded-xl mt-4 text-[15px] shadow-lg shadow-primary/50/20">{(isSubmitting || saveMutation.isPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Patient Profile'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
