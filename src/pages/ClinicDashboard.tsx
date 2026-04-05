import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClinicDashboardLayout } from '@/components/layout/ClinicDashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useClinicByOwner } from '@/hooks/queries/useClinics';
import { useClinicAppointments, useClinicUpcomingAppointments } from '@/hooks/queries/useAppointments';
import {
  Loader2, Building2, CalendarCheck, ListTodo, ArrowRight, CalendarX, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ClinicOverviewStats } from '@/components/clinic-dashboard/ClinicOverviewStats';
import { ClinicAppointments } from '@/components/clinic-dashboard/ClinicAppointments';
import { ClinicSlots } from '@/components/clinic-dashboard/ClinicSlots';
import { ClinicSettings } from '@/components/clinic-dashboard/ClinicSettings';
import { ClinicDoctors } from '@/components/clinic-dashboard/ClinicDoctors';
import { ClinicServices } from '@/components/clinic-dashboard/ClinicServices';
import { ClinicPatients } from '@/components/clinic-dashboard/ClinicPatients';
import { ClinicAnalytics } from '@/components/clinic-dashboard/ClinicAnalytics';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';

type Tab = 'overview' | 'appointments' | 'slots' | 'doctors' | 'services' | 'patients' | 'analytics' | 'reviews' | 'profile';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');

  const tabTitles: Record<Tab, string> = {
    overview: 'Dashboard', appointments: 'Appointments', slots: 'Slots',
    doctors: 'Doctors', services: 'Services', patients: 'Patients',
    analytics: 'Analytics', reviews: 'Reviews', profile: 'Settings'
  };
  useDocumentTitle(`Clinic ${tabTitles[activeTab]}`);

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    if (tab !== 'slots') {
      newParams.delete('doctor');
    }
    setSearchParams(newParams, { replace: true });
  };

  const { data: clinic, isLoading, refetch: refetchClinic } = useClinicByOwner(user?.id);
  const { data: appointments = [], refetch: refetchAppointments } = useClinicAppointments(clinic?.id, selectedDate);
  const { data: allAppointments = [], refetch: refetchAllAppointments } = useClinicUpcomingAppointments(
    clinic?.id, format(new Date(), 'yyyy-MM-dd')
  );

  // For the appointments tab horizontal layout (roughly 14 days starting from today to show forward schedule mainly)
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { 
      value: format(date, 'yyyy-MM-dd'), 
      dayStr: format(date, 'EEE').toUpperCase(), 
      numStr: format(date, 'd'),
      isToday: i === 0
    };
  });

  // Keep scroll at top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  if (authLoading || !isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-[#006b5f]/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-slate-900" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Clinic Found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">You haven't registered a clinic yet. Create your clinical sanctuary to access the dashboard and manage your practice seamlessly.</p>
          <Button onClick={() => navigate('/register-clinic')} className="w-full py-6 rounded-xl font-bold bg-[#006b5f] hover:bg-[#005048] text-white shadow-lg transition-all hover:-translate-y-0.5">
            Register Your Clinic
          </Button>
        </div>
      </div>
    );
  }

  const todayAppointments = allAppointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd'));
  const pendingCount = allAppointments.filter(a => a.status === 'pending').length;

  return (
    <ClinicDashboardLayout 
      activeTab={activeTab}
      onTabChange={handleTabChange}
      clinic={clinic}
      user={user}
    >
      <div className="w-full mx-auto max-w-7xl animate-in fade-in duration-500">
        
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="text-slate-900">
            {/* Greeting */}
            <div className="mb-8 pl-1">
              <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Clinic Management Dashboard</h2>
              <p className="text-slate-500 mt-2 font-medium text-[15px]">Welcome back, here is what's happening today at {clinic.name}.</p>
            </div>

            <ClinicOverviewStats 
              todaysCount={todayAppointments.length} 
              pendingCount={pendingCount} 
              upcomingCount={allAppointments.length} 
              fees={clinic.fees} 
            />

            {/* Appointment Status Section */}
            <section className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border-none overflow-hidden relative">
              <div className="px-6 md:px-10 py-6 flex justify-between items-center bg-white border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <ListTodo className="h-5 w-5 text-slate-900" />
                  <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Today's Appointments</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs font-bold text-slate-900 hover:text-black flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="p-10 md:p-24 flex flex-col items-center justify-center text-center bg-white min-h-[450px]">
                  <div className="relative mb-12 transform hover:scale-105 transition-transform duration-500">
                    <div className="w-[180px] h-[180px] bg-[#e6fffb] rounded-full flex items-center justify-center shadow-inner">
                      <div className="w-[130px] h-[130px] bg-[#ccfff5] rounded-full flex items-center justify-center">
                        <CalendarX className="w-16 h-16 text-primary" strokeWidth={2.5} />
                      </div>
                    </div>
                    {/* Floating overlapping amber badge exactly like image */}
                    <div className="absolute right-[-10px] bottom-[-5px] bg-white p-3.5 rounded-2xl shadow-[0_8px_25px_rgb(0,0,0,0.1)] border border-slate-50">
                      <p className="text-amber-500 font-extrabold text-xl leading-none">🔍</p>
                    </div>
                  </div>
                  <h4 className="text-[22px] font-black text-slate-800 mb-3 tracking-tight">No appointments today</h4>
                  <p className="text-slate-500 max-w-sm mx-auto mb-10 text-[14px] leading-relaxed font-medium">
                    The schedule is clear for today. You can use this time to organize records or update doctor schedules.
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                    <Button 
                      onClick={() => navigate(clinic?.id ? `/book/${clinic.id}` : '/book')}
                      className="px-6 py-5 sm:py-[18px] sm:px-[22px] font-bold text-[14px] rounded-xl border-2 border-[#129a8a] bg-white text-[#129a8a] shadow-sm hover:bg-[#ebfcf9] transition-all flex items-center gap-2"
                    >
                      <Plus className="w-[18px] h-[18px] bg-[#129a8a] text-white rounded-full p-0.5" strokeWidth={3} />
                    Add Appointment 
                    </Button>
                    <Button 
                      onClick={() => { refetchAppointments(); refetchAllAppointments(); }}
                      className="px-6 py-5 sm:py-[18px] sm:px-[24px] font-bold text-[14px] rounded-xl bg-[#f1f5f9] text-slate-600 hover:bg-slate-200 border-none transition-all shadow-none"
                    >
                      Refresh Data
                    </Button>
                  </div>
                  
                  {/* Floating Add */}
                  <div className="absolute bottom-10 right-10 hidden md:block">
                     <button 
                       onClick={() => navigate(clinic?.id ? `/book/${clinic.id}` : '/book')}
                       className="w-14 h-14 bg-[#009e86] text-white rounded-full shadow-[0_8px_25px_-5px_rgba(0,189,165,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                     >
                       <Plus className="w-6 h-6" strokeWidth={3} />
                     </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-8 bg-white">
                  <ClinicAppointments 
                    appointments={todayAppointments.slice(0, 10)} 
                    onUpdate={() => { refetchAppointments(); refetchAllAppointments(); }} 
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {/* Appointments Tab Content (Fully matched to Image 3) */}
        {activeTab === 'appointments' && (
          <div className="text-slate-900 animate-in fade-in duration-500">
            <div className="mb-8 pl-1">
              <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Appointment Management</h2>
              <p className="text-slate-500 mt-2 font-medium text-[15px] max-w-2xl">Oversee daily patient schedules and clinic operations. Use the date picker below to navigate through your upcoming clinical commitments.</p>
            </div>

            {/* Redesigned Date Picker Card */}
            <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-50 p-6 sm:p-8 mb-6 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4 text-slate-800 font-extrabold text-[17px]">
                  {format(new Date(selectedDate), 'MMMM yyyy')}
                </div>
                <button 
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                  className="text-[14px] font-extrabold text-slate-900 hover:text-[#005048] tracking-wide"
                >
                  Jump to Today
                </button>
              </div>

              <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar">
                {dateOptions.map((option) => {
                  const isSelected = selectedDate === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDate(option.value)}
                      className={`min-w-[70px] flex flex-col items-center justify-center py-4 px-3 rounded-2xl transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#006b5f] text-white shadow-[0_10px_25px_-5px_rgba(0,107,95,0.4)] scale-105'
                          : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold tracking-widest mb-2 opacity-90">{option.dayStr}</span>
                      <span className={`text-[22px] font-black leading-none ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {option.numStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List or Empty State component inside native page area */}
            <div className={`mt-6 ${appointments.length > 0 ? 'bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-50 p-6 md:p-8' : ''}`}>
              <ClinicAppointments 
                appointments={appointments} 
                onUpdate={refetchAppointments} 
                date={selectedDate} 
                onViewSchedule={() => setActiveTab('slots')} 
              />
            </div>
          </div>
        )}

        {/* For Other Tabs, we provide a unified clean white container to keep it seamless */}
        {activeTab !== 'overview' && activeTab !== 'appointments' && (
          <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] p-6 md:p-10 min-h-[600px]">
            {activeTab === 'slots' && (
              <div className="animate-in fade-in duration-500">
                <ClinicSlots clinicId={clinic.id} />
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="animate-in fade-in duration-500">
                <ClinicDoctors clinicId={clinic.id} />
              </div>
            )}

            {activeTab === 'services' && (
              <div className="animate-in fade-in duration-500">
                <ClinicServices clinic={clinic} onUpdateClinic={() => refetchClinic()} />
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="animate-in fade-in duration-500">
                <ClinicPatients clinicId={clinic.id} />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-in fade-in duration-500">
                <ClinicAnalytics clinicId={clinic.id} clinicFees={clinic.fees} clinicRating={clinic.rating} />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-4 tracking-tight">Patient Reviews</h2>
                <ClinicReviews clinicId={clinic.id} />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-500">
                <ClinicSettings clinic={clinic} onUpdate={() => refetchClinic()} />
              </div>
            )}
          </div>
        )}
      </div>
    </ClinicDashboardLayout>
  );
}
