import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Building2,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import type { Appointment, Clinic, TimeSlot } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'appointments' | 'slots' | 'profile'>('appointments');

  // Slot creation form
  const [newSlot, setNewSlot] = useState({ date: selectedDate, startTime: '', endTime: '' });
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);

  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!hasRole('clinic') && !hasRole('admin')) {
        toast.error('You do not have access to the clinic dashboard');
        navigate('/');
      }
    }
  }, [user, hasRole, authLoading, isInitialized, navigate]);

  useEffect(() => {
    if (user && (hasRole('clinic') || hasRole('admin'))) {
      fetchClinicData();
    }
  }, [user]);

  useEffect(() => {
    if (clinic) {
      fetchAppointments();
      fetchSlots();
    }
  }, [clinic, selectedDate]);

  const fetchClinicData = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

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
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('date', selectedDate)
        .order('time');

      if (error) throw error;
      setAppointments(data as Appointment[] || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchSlots = async () => {
    if (!clinic) return;
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('date', selectedDate)
        .order('start_time');

      if (error) throw error;
      setSlots(data as TimeSlot[] || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
      );
      toast.success(`Appointment ${status}`);
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const createSlot = async () => {
    if (!clinic || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill all fields');
      return;
    }

    setIsCreatingSlot(true);
    try {
      const { error } = await supabase.from('time_slots').insert({
        clinic_id: clinic.id,
        date: newSlot.date,
        start_time: newSlot.startTime,
        end_time: newSlot.endTime,
        is_available: true,
      });

      if (error) throw error;

      toast.success('Slot created successfully');
      setNewSlot({ date: selectedDate, startTime: '', endTime: '' });
      fetchSlots();
    } catch (error) {
      toast.error('Failed to create slot');
    } finally {
      setIsCreatingSlot(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slotId);
      if (error) throw error;
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success('Slot deleted');
    } catch (error) {
      toast.error('Failed to delete slot');
    }
  };

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE, MMM d'),
      isToday: i === 0,
    };
  });

  if (authLoading || !isInitialized || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Clinic Found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't registered a clinic yet. Contact admin to get your clinic approved.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{clinic.name}</h1>
              <p className="text-muted-foreground mt-1">Manage your clinic</p>
            </div>
            <Badge variant={clinic.is_approved ? 'success' : 'warning'}>
              {clinic.is_approved ? 'Approved' : 'Pending Approval'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['appointments', 'slots', 'profile'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Date Selector */}
        {activeTab !== 'profile' && (
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

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Appointments for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
            </h2>

            {appointments.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No appointments for this date
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} variant="elevated">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{apt.patient_name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {apt.patient_phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {apt.time.slice(0, 5)}
                            </span>
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                              {apt.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              apt.status === 'confirmed'
                                ? 'confirmed'
                                : apt.status === 'cancelled'
                                ? 'cancelled'
                                : 'pending'
                            }
                          >
                            {apt.status}
                          </Badge>

                          {apt.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Time Slots for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              </h2>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Time Slot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date</label>
                      <Input
                        type="date"
                        value={newSlot.date}
                        onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Time</label>
                        <Input
                          type="time"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Time</label>
                        <Input
                          type="time"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={createSlot}
                      disabled={isCreatingSlot}
                    >
                      {isCreatingSlot ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create Slot'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {slots.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No slots for this date. Add some slots for patients to book.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {slots.map((slot) => (
                  <Card
                    key={slot.id}
                    className={`${slot.is_available ? '' : 'opacity-50'}`}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => deleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Clinic Profile</CardTitle>
              <CardDescription>View and manage your clinic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-semibold">{clinic.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="font-semibold">{clinic.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="font-semibold">{clinic.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Consultation Fee</label>
                  <p className="font-semibold">₹{clinic.fees}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-semibold">{clinic.phone || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <p className="font-semibold">{clinic.rating || '—'}</p>
                </div>
              </div>
              {clinic.specializations.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Specializations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {clinic.specializations.map((spec) => (
                      <Badge key={spec} variant="accent">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
