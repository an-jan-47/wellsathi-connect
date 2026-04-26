import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useClinicByOwner } from '@/hooks/queries/useClinics';
import { useClinicAppointments, useClinicUpcomingAppointments } from '@/hooks/queries/useAppointments';
import {
  Calendar, Loader2, Building2, Users, Stethoscope, Clock, CalendarCheck,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ClinicAppointments } from '@/components/clinic-dashboard/ClinicAppointments';
import { ClinicSlots } from '@/components/clinic-dashboard/ClinicSlots';
import { ClinicProfileEditor } from '@/components/clinic-dashboard/ClinicProfileEditor';
import { ClinicDoctors } from '@/components/clinic-dashboard/ClinicDoctors';
import { ClinicServices } from '@/components/clinic-dashboard/ClinicServices';
import { ClinicAnalytics } from '@/components/clinic-dashboard/ClinicAnalytics';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';
import { StatCard } from '@/components/common/StatCard';

type Tab = 'overview' | 'appointments' | 'slots' | 'doctors' | 'services' | 'analytics' | 'reviews' | 'profile';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: clinic, isLoading, refetch: refetchClinic } = useClinicByOwner(user?.id);
  const { data: appointments = [], refetch: refetchAppointments } = useClinicAppointments(clinic?.id, selectedDate);
  const { data: allAppointments = [], refetch: refetchAllAppointments } = useClinicUpcomingAppointments(
    clinic?.id, format(new Date(), 'yyyy-MM-dd')
  );

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'slots', label: 'Doctor Schedules', icon: <Clock className="h-4 w-4" /> },
    { id: 'doctors', label: 'Doctors', icon: <Users className="h-4 w-4" /> },
    { id: 'services', label: 'Services', icon: <Stethoscope className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Calendar className="h-4 w-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Users className="h-4 w-4" /> },
    { id: 'profile', label: 'Profile', icon: <Building2 className="h-4 w-4" /> },
  ];

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
    <Layout>
      <div className="gradient-hero py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{clinic.name}</h1>
              <p className="text-muted-foreground mt-1">Clinic Management Dashboard</p>
            </div>
            <Badge variant={clinic.is_approved ? 'success' : 'warning'} className="self-start">
              {clinic.is_approved ? 'Approved' : 'Pending Approval'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-primary border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

          {/* Date Selector for appointments */}
          {(activeTab === 'appointments') && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDate(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDate === option.value
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.isToday ? 'Today' : option.label}
              </button>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<CalendarCheck className="h-5 w-5" />} label="Today's Appointments" value={todayAppointments.length} color="primary" />
              <StatCard icon={<Clock className="h-5 w-5" />} label="Pending Approval" value={pendingCount} color="warning" />
              <StatCard icon={<Calendar className="h-5 w-5" />} label="Upcoming Total" value={allAppointments.length} color="info" />
              <StatCard icon={<Building2 className="h-5 w-5" />} label="Consultation Fee" value={`₹${clinic.fees}`} color="success" />
            </div>

            {/* Today's appointments preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Appointments</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')}>View All →</Button>
              </div>
              {todayAppointments.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No appointments today
                  </CardContent>
                </Card>
              ) : (
                <ClinicAppointments appointments={todayAppointments.slice(0, 5)} onUpdate={() => { refetchAppointments(); refetchAllAppointments(); }} />
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Appointments — {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </h2>
            <ClinicAppointments appointments={appointments} onUpdate={refetchAppointments} />
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
            <h2 className="text-lg font-semibold mb-4">Manage Doctors</h2>
            <ClinicDoctors clinicId={clinic.id} />
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Manage Services</h2>
            <ClinicServices clinicId={clinic.id} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Analytics & Insights</h2>
            <ClinicAnalytics clinicId={clinic.id} clinicFees={clinic.fees} clinicRating={clinic.rating} />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Patient Reviews</h2>
            <ClinicReviews clinicId={clinic.id} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ClinicProfileEditor clinic={clinic} onUpdate={() => refetchClinic()} />
        )}
      </div>
    </Layout>
  );
}
