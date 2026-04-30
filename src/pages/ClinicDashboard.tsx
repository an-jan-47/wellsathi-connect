import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClinicDashboardLayout } from '@/components/layout/ClinicDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useClinicByOwner } from '@/hooks/queries/useClinics';
import { useClinicAppointments, useClinicUpcomingAppointments, useInfiniteClinicAppointments } from '@/hooks/queries/useAppointments';
import {
  Calendar, Loader2, Building2, Users, Stethoscope, Clock, CalendarCheck,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ClinicAppointments } from '@/components/clinic-dashboard/ClinicAppointments';
import { ClinicOverviewStats } from '@/components/clinic-dashboard/ClinicOverviewStats';
import { ClinicSlots } from '@/components/clinic-dashboard/ClinicSlots';
import { ClinicSettings } from '@/components/clinic-dashboard/ClinicSettings';
import { ClinicDoctors } from '@/components/clinic-dashboard/ClinicDoctors';
import { ClinicServices } from '@/components/clinic-dashboard/ClinicServices';
import { ClinicAnalytics } from '@/components/clinic-dashboard/ClinicAnalytics';
import { ClinicPatients } from '@/components/clinic-dashboard/ClinicPatients';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';

type Tab = 'overview' | 'appointments' | 'slots' | 'doctors' | 'services' | 'patients' | 'analytics' | 'reviews' | 'profile';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [appointmentViewMode, setAppointmentViewMode] = useState<'date' | 'upcoming' | 'past'>('date');

  const { data: clinic, isLoading, refetch: refetchClinic } = useClinicByOwner(user?.id);
  const { data: dateAppointments = [], refetch: refetchAppointments } = useClinicAppointments(clinic?.id, selectedDate);
  const { data: allAppointments = [], refetch: refetchAllAppointments } = useClinicUpcomingAppointments(
    clinic?.id, format(new Date(), 'yyyy-MM-dd')
  );
  
  const { 
    data: infiniteUpcoming, 
    fetchNextPage: fetchNextUpcoming, 
    hasNextPage: hasNextUpcoming, 
    isFetchingNextPage: isFetchingNextUpcoming,
    refetch: refetchUpcoming 
  } = useInfiniteClinicAppointments(clinic?.id, 'upcoming');
  
  const { 
    data: infinitePast, 
    fetchNextPage: fetchNextPast, 
    hasNextPage: hasNextPast, 
    isFetchingNextPage: isFetchingNextPast,
    refetch: refetchPast 
  } = useInfiniteClinicAppointments(clinic?.id, 'past');

  let activeAppointments = [];
  let fetchNextPage = undefined;
  let hasNextPage = false;
  let isFetchingNextPage = false;
  let handleUpdateAppointments = () => { refetchAppointments(); };

  if (appointmentViewMode === 'date') {
    activeAppointments = dateAppointments;
    handleUpdateAppointments = () => { refetchAppointments(); refetchAllAppointments(); };
  } else if (appointmentViewMode === 'upcoming') {
    activeAppointments = infiniteUpcoming?.pages.flat() || [];
    fetchNextPage = fetchNextUpcoming;
    hasNextPage = hasNextUpcoming;
    isFetchingNextPage = isFetchingNextUpcoming;
    handleUpdateAppointments = () => { refetchUpcoming(); refetchAllAppointments(); };
  } else if (appointmentViewMode === 'past') {
    activeAppointments = infinitePast?.pages.flat() || [];
    fetchNextPage = fetchNextPast;
    hasNextPage = hasNextPast;
    isFetchingNextPage = isFetchingNextPast;
    handleUpdateAppointments = () => { refetchPast(); refetchAllAppointments(); };
  }

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });



  if (authLoading || !isInitialized || isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!clinic) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Clinic Found</h2>
          <p className="text-muted-foreground mb-6">Register your clinic to get started.</p>
          <Button onClick={() => navigate('/register-clinic')}>Register Clinic</Button>
        </div>
      </Layout>
    );
  }

  const todayAppointments = allAppointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd'));
  const pendingCount = allAppointments.filter(a => a.status === 'pending').length;

  return (
    <ClinicDashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      clinic={clinic}
      user={user}
    >
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ClinicOverviewStats 
              todaysCount={todayAppointments.length} 
              pendingCount={pendingCount} 
              upcomingCount={allAppointments.length} 
              fees={clinic.fees} 
            />

            {/* Today's appointments preview */}
            <div>
              <div className="flex items-center justify-between mb-4 pl-1">
                <div>
                  <h2 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">Today's Appointments</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')} className="text-primary font-bold hover:bg-primary/5">View All →</Button>
              </div>
              <ClinicAppointments 
                clinicId={clinic.id} 
                appointments={todayAppointments.slice(0, 5)} 
                onUpdate={() => { refetchAppointments(); refetchAllAppointments(); }} 
              />
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pl-1">
              <div>
                <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">Appointments</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-[15px]">Manage and review your upcoming patient consultations.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAppointmentViewMode('upcoming')}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    appointmentViewMode === 'upcoming'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  All Upcoming
                </button>
                <button
                  onClick={() => setAppointmentViewMode('past')}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    appointmentViewMode === 'past'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Past
                </button>
                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSelectedDate(option.value); setAppointmentViewMode('date'); }}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                      appointmentViewMode === 'date' && selectedDate === option.value
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option.isToday ? 'Today' : option.label}
                  </button>
                ))}
              </div>
            </div>
            <ClinicAppointments 
              clinicId={clinic.id} 
              appointments={activeAppointments} 
              onUpdate={handleUpdateAppointments} 
              date={appointmentViewMode === 'date' ? selectedDate : undefined} 
              onViewSchedule={() => setActiveTab('slots')}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        )}

        {/* Slots Tab */}
          {activeTab === 'slots' && (
            <div>
              <ClinicSlots clinicId={clinic.id} />
            </div>
          )}

          {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div>
            <ClinicDoctors clinicId={clinic.id} />
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <ClinicServices clinic={clinic} onUpdateClinic={() => refetchClinic()} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <ClinicAnalytics clinicId={clinic.id} clinicFees={clinic.fees} clinicRating={clinic.rating} />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <ClinicReviews clinicId={clinic.id} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ClinicSettings clinic={clinic} onUpdate={() => refetchClinic()} />
        )}
        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div>
            <ClinicPatients clinicId={clinic.id} />
          </div>
        )}
      </div>
    </ClinicDashboardLayout>
  );
}
