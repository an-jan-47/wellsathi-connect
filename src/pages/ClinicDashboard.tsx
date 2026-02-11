import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Calendar, Loader2, Building2, Users, Stethoscope, Clock, CalendarCheck,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { Appointment, Clinic, TimeSlot } from '@/types';
import { ClinicAppointments } from '@/components/clinic-dashboard/ClinicAppointments';
import { ClinicSlots } from '@/components/clinic-dashboard/ClinicSlots';
import { ClinicProfileEditor } from '@/components/clinic-dashboard/ClinicProfileEditor';
import { ClinicDoctors } from '@/components/clinic-dashboard/ClinicDoctors';
import { ClinicServices } from '@/components/clinic-dashboard/ClinicServices';

type Tab = 'overview' | 'appointments' | 'slots' | 'doctors' | 'services' | 'profile';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!user) navigate('/auth');
      else if (!hasRole('clinic') && !hasRole('admin')) {
        toast.error('You do not have access to the clinic dashboard');
        navigate('/');
      }
    }
  }, [user, hasRole, authLoading, isInitialized, navigate]);

  useEffect(() => {
    if (user && (hasRole('clinic') || hasRole('admin'))) fetchClinicData();
  }, [user]);

  useEffect(() => {
    if (clinic) {
      fetchAppointments();
      fetchSlots();
    }
  }, [clinic, selectedDate]);

  useEffect(() => {
    if (clinic) fetchAllAppointments();
  }, [clinic]);

  const fetchClinicData = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics').select('*').eq('owner_id', user?.id).maybeSingle();
      if (error) throw error;
      setClinic(data as Clinic);
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!clinic) return;
    try {
      const { data, error } = await supabase
        .from('appointments').select('*')
        .eq('clinic_id', clinic.id).eq('date', selectedDate)
        .order('time');
      if (error) throw error;
      setAppointments(data as Appointment[] || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchAllAppointments = async () => {
    if (!clinic) return;
    try {
      const { data, error } = await supabase
        .from('appointments').select('*')
        .eq('clinic_id', clinic.id)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date').order('time').limit(50);
      if (error) throw error;
      setAllAppointments(data as Appointment[] || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSlots = async () => {
    if (!clinic) return;
    try {
      const { data, error } = await supabase
        .from('time_slots').select('*')
        .eq('clinic_id', clinic.id).eq('date', selectedDate)
        .order('start_time');
      if (error) throw error;
      setSlots(data as TimeSlot[] || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'slots', label: 'Time Slots', icon: <Clock className="h-4 w-4" /> },
    { id: 'doctors', label: 'Doctors', icon: <Users className="h-4 w-4" /> },
    { id: 'services', label: 'Services', icon: <Stethoscope className="h-4 w-4" /> },
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

        {/* Date Selector for appointments and slots */}
        {(activeTab === 'appointments' || activeTab === 'slots') && (
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
                <ClinicAppointments appointments={todayAppointments.slice(0, 5)} onUpdate={() => { fetchAppointments(); fetchAllAppointments(); }} />
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
            <ClinicAppointments appointments={appointments} onUpdate={fetchAppointments} />
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === 'slots' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Time Slots — {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </h2>
            <ClinicSlots clinicId={clinic.id} slots={slots} selectedDate={selectedDate} onUpdate={fetchSlots} />
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ClinicProfileEditor clinic={clinic} onUpdate={setClinic} />
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    success: 'bg-success/10 text-success',
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
