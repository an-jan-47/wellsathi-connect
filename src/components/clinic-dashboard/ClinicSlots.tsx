import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Clock, Info, Sparkles, MoreHorizontal, Calendar as CalendarIcon, Plus, Trash, Ban } from 'lucide-react';
import { ClinicSlotRowSkeleton } from '@/components/common/SkeletonLoaders';
import type { DoctorSchedule } from '@/types';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ClinicSlots({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const handleDoctorSelect = (val: string) => {
    setSelectedDoctorId(val);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('doctor', val);
    setSearchParams(newParams, { replace: true });
  };

  // Fetch Doctors
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['clinic-doctors', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const doctors = doctorsData || [];

  // Automatically select doctor from URL or default to first
  useEffect(() => {
    const docParam = searchParams.get('doctor');
    if (doctors.length > 0) {
      if (docParam && doctors.some(d => d.id === docParam)) {
        if (selectedDoctorId !== docParam) setSelectedDoctorId(docParam);
      } else if (!selectedDoctorId) {
        setSelectedDoctorId(doctors[0].id);
      }
    }
  }, [doctors, searchParams.get('doctor'), selectedDoctorId]);

  const selectedDoctor = useMemo(() => doctors.find(d => d.id === selectedDoctorId), [doctors, selectedDoctorId]);

  // Fetch Schedules for selected doctor
  const { data: schedulesData, isLoading: loadingSchedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['doctor-schedules', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return [];
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', selectedDoctorId);
      if (error) throw error;
      return data as DoctorSchedule[];
    },
    enabled: !!selectedDoctorId,
  });

  // Local state to manage form
  const [formState, setFormState] = useState<Record<number, Partial<DoctorSchedule>>>({});
  const [globalSlotDuration, setGlobalSlotDuration] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'weekly' | 'exceptions'>('weekly');
  const [isExceptionDialogOpen, setIsExceptionDialogOpen] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionReason, setExceptionReason] = useState('Holiday');
  const [isAddingException, setIsAddingException] = useState(false);

  const schedules = schedulesData || [];

  const initializeForm = () => {
    const newFormState: Record<number, Partial<DoctorSchedule>> = {};
    let fallbackDuration = 15;
    DAYS_OF_WEEK.forEach(day => {
      const existing = schedules.find(s => s.day_of_week === day.value);
      if (existing?.slot_duration) fallbackDuration = existing.slot_duration;
      newFormState[day.value] = {
        is_working_day: existing?.is_working_day ?? false,
        start_time: existing?.start_time ? existing.start_time.slice(0, 5) : '09:00',
        end_time: existing?.end_time ? existing.end_time.slice(0, 5) : '17:00',
        slot_duration: existing?.slot_duration ?? 15,
      };
    });
    setFormState(newFormState);
    setGlobalSlotDuration(fallbackDuration);
  };

  useEffect(() => {
    if (schedulesData) {
      initializeForm();
    }
  }, [schedulesData]);

  const updateDay = (day: number, field: keyof DoctorSchedule, value: string | number | boolean) => {
    setFormState(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const updateGlobalDuration = (duration: number) => {
    setGlobalSlotDuration(duration);
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(day => {
        newState[Number(day)].slot_duration = duration;
      });
      return newState;
    });
  };

  const handleSave = async () => {
    if (!selectedDoctorId) return;
    setIsSaving(true);
    
    const payload = DAYS_OF_WEEK.map(day => {
      const d = formState[day.value];
      return {
        doctor_id: selectedDoctorId,
        clinic_id: clinicId,
        day_of_week: day.value,
        is_working_day: d.is_working_day,
        start_time: d.start_time,
        end_time: d.end_time,
        slot_duration: d.slot_duration || globalSlotDuration,
      };
    });

    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .upsert(payload, { onConflict: 'doctor_id,day_of_week' });
      
      if (error) throw error;
      setLastSaved(new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      toast.success('Schedule saved successfully');
      refetchSchedules();
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    } catch (err: any) {
      toast.error('Failed to save schedule: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    initializeForm();
    toast.info('Changes discarded');
  };

  // Fetch Exceptions
  const { data: exceptionsData, isLoading: loadingExceptions, refetch: refetchExceptions } = useQuery({
    queryKey: ['doctor-exceptions', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return [];
      const { data, error } = await supabase
        .from('doctor_slot_overrides')
        .select('*')
        .eq('doctor_id', selectedDoctorId)
        .eq('is_available', false)
        .order('override_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDoctorId && activeTab === 'exceptions',
  });

  const exceptions = exceptionsData || [];

  const handleAddException = async () => {
    if (!selectedDoctorId || !exceptionDate) return;
    setIsAddingException(true);
    try {
      const { error } = await supabase
        .from('doctor_slot_overrides')
        .insert({
          doctor_id: selectedDoctorId,
          override_date: exceptionDate,
          reason: exceptionReason,
          is_available: false,
        });
      if (error) throw error;
      toast.success('Exception added');
      setIsExceptionDialogOpen(false);
      setExceptionDate('');
      refetchExceptions();
    } catch (err: any) {
      toast.error('Failed to add exception: ' + err.message);
    } finally {
      setIsAddingException(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_slot_overrides')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Exception removed');
      refetchExceptions();
    } catch (err: any) {
      toast.error('Failed to remove exception: ' + err.message);
    }
  };

  const copyToAllWorkingDays = (sourceDayValue: number) => {
    const sourceState = formState[sourceDayValue];
    if (!sourceState || !sourceState.is_working_day) return;
    
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(d => {
        const dayNum = Number(d);
        if (dayNum !== sourceDayValue && newState[dayNum].is_working_day) {
          newState[dayNum].start_time = sourceState.start_time;
          newState[dayNum].end_time = sourceState.end_time;
        }
      });
      return newState;
    });
    toast.success('Times copied to all working days');
  };

  if (loadingDoctors) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-[24px] p-8 h-40 animate-pulse" />
        <div className="bg-card border border-border rounded-[24px] p-6 h-40 animate-pulse" />
      </div>
    </div>
  );

  if (doctors.length === 0) {
    return (
      <div className="bg-card border border-border p-10 rounded-3xl text-center">
        <p className="text-muted-foreground font-medium text-lg">Please add doctors first to manage their schedules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 pl-1">
        <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Doctor Schedule Management</h2>
        <p className="text-slate-500 mt-2 font-medium text-[15px]">Configure availability and time slots for your clinical team</p>
      </div>

      {/* Top Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Practitioner Selection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none p-6 md:p-8">
          <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4">Select Practitioner</p>
          <Select value={selectedDoctorId || ''} onValueChange={handleDoctorSelect}>
            <SelectTrigger className="w-full text-[15px] font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl h-14 px-4 focus:ring-0 focus:border-[#006b5f] transition-all">
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-700 shadow-xl dark:bg-slate-800">
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id} className="font-bold py-3 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-6">
            Currently viewing the weekly availability for <strong className="text-slate-800 dark:text-white">{selectedDoctor?.name || 'this doctor'}</strong>. Changes made here will affect the patient booking calendar immediately.
          </p>
        </div>

        {/* Global Slot Duration */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-50 dark:border-slate-600">
            <Clock className="w-6 h-6 text-slate-900 dark:text-white" strokeWidth={2.5} />
          </div>
          <h4 className="text-[14px] font-black text-slate-900 dark:text-white mb-4">Global Slot Duration</h4>
          <div className="flex items-center gap-3">
             <input 
               type="number" 
               min={5} step={5} max={120} 
               value={globalSlotDuration} 
               onChange={(e) => updateGlobalDuration(Number(e.target.value))}
               className="w-16 h-12 text-center text-xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-[#006b5f]/20 dark:border-slate-600 rounded-xl shadow-sm outline-none focus:border-[#006b5f] focus:ring-1 focus:ring-[#006b5f]/20 transition-all appearance-none"
             />
             <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Minutes</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={`px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'exceptions' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          Exceptions / Leave
        </button>
      </div>

      {activeTab === 'weekly' ? (
      <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden">
        {/* Table Header */}
        <div className="px-6 md:px-8 py-6 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-900 dark:text-white" strokeWidth={2.5}/>
            <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">Weekly Working Hours</h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#006b5f] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Active Configuration</span>
          </div>
        </div>

        <div className="p-0">
          {loadingSchedules ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {[...Array(7)].map((_, i) => <ClinicSlotRowSkeleton key={i} />)}
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] border-b border-slate-50 dark:border-slate-700">
                <div className="col-span-3">Day of Week</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Shift Start</div>
                <div className="col-span-3">Shift End</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-50/80 dark:divide-slate-700">
                {DAYS_OF_WEEK.map(day => {
                  const state = formState[day.value] || {};
                  const isWorking = state.is_working_day;
                  return (
                    <div key={day.value} className={`grid grid-cols-1 md:grid-cols-12 gap-5 px-6 md:px-8 py-5 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/30 ${!isWorking ? 'opacity-60 grayscale-[30%]' : ''}`}>
                      <div className="md:col-span-3 font-bold text-[15px] text-slate-800 dark:text-white flex justify-between items-center">
                        <span className={!isWorking ? 'text-slate-500 dark:text-slate-500' : ''}>{day.label}</span>
                        <div className="md:hidden flex items-center gap-3">
                          <span className={`text-[12px] font-bold ${isWorking ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{isWorking ? 'Working' : 'Off'}</span>
                          <button onClick={() => updateDay(day.value, 'is_working_day', !isWorking)} className={`w-[42px] h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isWorking ? 'bg-[#006b5f]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${isWorking ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center gap-3">
                        <button onClick={() => updateDay(day.value, 'is_working_day', !isWorking)} className={`w-[42px] h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isWorking ? 'bg-[#006b5f]' : 'bg-slate-200 dark:bg-slate-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${isWorking ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-[13px] font-bold ${isWorking ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{isWorking ? 'Working' : 'Off'}</span>
                      </div>
                      <div className="md:col-span-3">
                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shift Start</div>
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${!isWorking ? 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 pointer-events-none' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus-within:border-[#006b5f] shadow-sm'}`}>
                          <Clock className={`w-4 h-4 ${!isWorking ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`} strokeWidth={2.5} />
                          <input type="time" value={state.start_time || ''} onChange={(e) => updateDay(day.value, 'start_time', e.target.value)} disabled={!isWorking} className="bg-transparent border-none outline-none text-[14px] font-extrabold text-slate-800 dark:text-white w-full disabled:text-slate-400 dark:disabled:text-slate-600" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shift End</div>
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${!isWorking ? 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 pointer-events-none' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus-within:border-[#006b5f] shadow-sm'}`}>
                          <Clock className={`w-4 h-4 ${!isWorking ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`} strokeWidth={2.5} />
                          <input type="time" value={state.end_time || ''} onChange={(e) => updateDay(day.value, 'end_time', e.target.value)} disabled={!isWorking} className="bg-transparent border-none outline-none text-[14px] font-extrabold text-slate-800 dark:text-white w-full disabled:text-slate-400 dark:disabled:text-slate-600" />
                        </div>
                      </div>
                      <div className="hidden md:flex md:col-span-1 justify-center relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors" disabled={!isWorking}><MoreHorizontal className="w-5 h-5" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium dark:bg-slate-800 dark:border-slate-700">
                            <DropdownMenuItem className="cursor-pointer font-semibold py-2.5 dark:text-slate-200" onClick={() => copyToAllWorkingDays(day.value)}>Copy to All Working</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive font-semibold py-2.5" onClick={() => updateDay(day.value, 'is_working_day', false)}>Set as Day Off</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating Action Footer */}
              <div className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 italic">
                  {lastSaved ? `Last saved: ${lastSaved}` : 'Any changes made are unsaved'}
                </p>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button onClick={handleDiscard} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[14px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Discard</button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none px-8 py-[22px] rounded-xl text-[14px] font-bold bg-[#006b5f] hover:bg-[#005048] text-white shadow-lg shadow-[#006b5f]/20 transition-all hover:-translate-y-0.5">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Schedule
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden p-6 md:p-8">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">Time Off & Exceptions</h3>
               <p className="text-slate-500 dark:text-slate-400 text-[14px] font-medium mt-1">Block specific dates for holidays or personal leave.</p>
             </div>
             <Button onClick={() => setIsExceptionDialogOpen(true)} className="bg-[#006b5f] hover:bg-[#005048] text-white rounded-xl font-bold px-5 py-2.5 h-auto flex items-center gap-2">
               <Plus className="w-4 h-4" strokeWidth={3} />Add Leave
             </Button>
           </div>
           {loadingExceptions ? (
             <div className="py-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-900 dark:text-white" /></div>
           ) : exceptions.length === 0 ? (
             <div className="py-16 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
               <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm mb-4"><CalendarIcon className="w-6 h-6 text-slate-400" /></div>
               <h4 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-1">No upcoming exceptions</h4>
               <p className="text-slate-500 dark:text-slate-400 text-[14px] font-medium max-w-[250px]">Doctor is available on all scheduled working days.</p>
             </div>
           ) : (
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {exceptions.map((exc: any) => (
                 <div key={exc.id} className="p-5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                   <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 mb-4 inline-flex"><Ban className="w-5 h-5" strokeWidth={2.5} /></div>
                   <h5 className="font-black text-slate-900 dark:text-white text-[16px] mb-1">{new Date(exc.override_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</h5>
                   <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-wider">{exc.reason}</p>
                   <button onClick={() => handleDeleteException(exc.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash className="w-4 h-4" strokeWidth={2.5} /></button>
                 </div>
               ))}
             </div>
           )}
           <Dialog open={isExceptionDialogOpen} onOpenChange={setIsExceptionDialogOpen}>
             <DialogContent className="sm:max-w-[425px] rounded-3xl dark:bg-slate-800 dark:border-slate-700">
               <DialogHeader><DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Add Day Off</DialogTitle></DialogHeader>
               <div className="grid gap-5 py-4">
                 <div className="space-y-2">
                   <label className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</label>
                   <input type="date" value={exceptionDate} onChange={e => setExceptionDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:border-[#006b5f] outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason</label>
                   <input type="text" value={exceptionReason} onChange={e => setExceptionReason(e.target.value)} placeholder="e.g. Holiday, Sick Leave" className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:border-[#006b5f] outline-none transition-all" />
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsExceptionDialogOpen(false)} className="rounded-xl font-bold border-slate-200 dark:border-slate-600 dark:text-slate-200">Cancel</Button>
                 <Button onClick={handleAddException} disabled={!exceptionDate || isAddingException} className="rounded-xl font-bold bg-[#006b5f] hover:bg-[#005048] text-white">
                   {isAddingException ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Confirm Day Off
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        </div>
      )}

      {/* Bottom Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 p-6 flex gap-4 shadow-sm items-start">
          <div className="w-10 h-10 rounded-full bg-[#f0f6ff] dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0"><Info className="w-5 h-5 text-[#1e62a8]" strokeWidth={2.5}/></div>
          <div>
            <h5 className="font-extrabold text-slate-900 dark:text-white text-[15px] mb-1.5">Time Slot Optimization</h5>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Consider increasing slot duration for initial consultations (Recommended: 30 mins) while keeping follow-ups at 15 mins.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 p-6 flex gap-4 shadow-sm items-start">
          <div className="w-10 h-10 rounded-full bg-[#e5fcf8] dark:bg-primary/10 flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-slate-900 dark:text-primary" strokeWidth={2.5}/></div>
          <div>
            <h5 className="font-extrabold text-slate-900 dark:text-white text-[15px] mb-1.5">Recurring Schedule</h5>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This schedule repeats weekly. To set specific holiday dates or leave, use the 'Exceptions' tab in the doctor profile.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
