import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin, Loader2, Search } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import type { Appointment, Clinic } from '@/types';

interface AppointmentWithClinic extends Appointment {
  clinics: Clinic;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, isInitialized } = useAuthStore();
  const [appointments, setAppointments] = useState<AppointmentWithClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, isInitialized, navigate]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, clinics(*)')
        .eq('user_id', user?.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data as AppointmentWithClinic[] || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => !isPast(parseISO(`${apt.date}T${apt.time}`)) || isToday(parseISO(apt.date))
  );

  const pastAppointments = appointments.filter(
    (apt) => isPast(parseISO(`${apt.date}T${apt.time}`)) && !isToday(parseISO(apt.date))
  );

  if (authLoading || !isInitialized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {profile?.name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your appointments and health journey
          </p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No appointments yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Find a clinic and book your first appointment
              </p>
              <Button asChild>
                <Link to="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Find Clinics
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Upcoming Appointments
              </h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming appointments
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Past Appointments
                </h2>
                <div className="grid gap-4">
                  {pastAppointments.slice(0, 5).map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} isPast />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AppointmentCard({
  appointment,
  isPast = false,
}: {
  appointment: AppointmentWithClinic;
  isPast?: boolean;
}) {
  const statusVariant = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled',
  } as const;

  return (
    <Card variant={isPast ? 'default' : 'elevated'} className={isPast ? 'opacity-75' : ''}>
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-foreground">
                {appointment.clinics?.name?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {appointment.clinics?.name || 'Clinic'}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(appointment.date), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {appointment.time.slice(0, 5)}
                </span>
                {appointment.clinics?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {appointment.clinics.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Badge variant={statusVariant[appointment.status]}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
