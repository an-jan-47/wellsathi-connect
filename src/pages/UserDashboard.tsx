import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useUserAppointments, useCancelAppointment } from '@/hooks/queries/useAppointments';
import { useUpdateProfile } from '@/hooks/queries/useProfile';
import { Calendar, Clock, MapPin, Loader2, Search, XCircle, User, Phone, Save, Star } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';
import type { AppointmentWithClinic } from '@/services/appointmentService';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, isInitialized } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile'>('appointments');

  // Profile editing
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

  const { data: appointments = [], isLoading } = useUserAppointments(user?.id);
  const cancelMutation = useCancelAppointment();
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      setProfileForm({ name: profile.name || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const cancelAppointment = (id: string) => {
    cancelMutation.mutate(id);
  };

  const saveProfile = () => {
    if (!profileForm.name.trim() || !user) return;
    updateProfileMutation.mutate({
      userId: user.id,
      data: { name: profileForm.name.trim(), phone: profileForm.phone.trim() || null },
    });
  };

  const upcomingAppointments = appointments.filter(
    (apt) => !isPast(parseISO(`${apt.date}T${apt.time}`)) || isToday(parseISO(apt.date))
  );
  const pastAppointments = appointments.filter(
    (apt) => isPast(parseISO(`${apt.date}T${apt.time}`)) && !isToday(parseISO(apt.date))
  );

  if (authLoading || !isInitialized) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.name || 'User'}</h1>
          <p className="text-muted-foreground mt-2">Manage your appointments and profile</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['appointments', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-card text-primary border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'appointments' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : appointments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No appointments yet</h3>
                  <p className="text-muted-foreground mb-6">Find a clinic and book your first appointment</p>
                  <Button asChild><Link to="/search"><Search className="h-4 w-4 mr-2" />Find Clinics</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming ({upcomingAppointments.length})</h2>
                  {upcomingAppointments.length > 0 ? (
                    <div className="grid gap-4">
                      {upcomingAppointments.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} onCancel={cancelAppointment} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/50"><CardContent className="py-8 text-center text-muted-foreground">No upcoming appointments</CardContent></Card>
                  )}
                </section>
                {pastAppointments.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Past ({pastAppointments.length})</h2>
                    <div className="grid gap-4">
                      {pastAppointments.slice(0, 10).map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} isPast onReviewDone={fetchAppointments} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="pl-11" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="pl-11" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <Button onClick={saveProfile} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function AppointmentCard({ appointment, isPast = false, onCancel, onReviewDone }: {
  appointment: AppointmentWithClinic;
  isPast?: boolean;
  onCancel?: (id: string) => void;
  onReviewDone?: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const statusVariant = { pending: 'pending', confirmed: 'confirmed', cancelled: 'cancelled' } as const;
  const canCancel = !isPast && appointment.status === 'pending' && onCancel;
  const canReview = isPast && appointment.status === 'confirmed';

  return (
    <>
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
                <h3 className="font-semibold text-foreground">{appointment.clinics?.name || 'Clinic'}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(parseISO(appointment.date), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{appointment.time.slice(0, 5)}</span>
                  {appointment.clinics?.city && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{appointment.clinics.city}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[appointment.status]}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Badge>
              {canReview && (
                <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
                  <Star className="h-4 w-4 mr-1" />Review
                </Button>
              )}
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                      <XCircle className="h-4 w-4 mr-1" />Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onCancel(appointment.id)} className="bg-destructive text-destructive-foreground">
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {appointment.clinics?.name}</DialogTitle>
          </DialogHeader>
          <ClinicReviews
            clinicId={appointment.clinic_id}
            showForm
            appointmentId={appointment.id}
            onReviewSubmitted={() => {
              setReviewOpen(false);
              onReviewDone?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
