import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useUserAppointments, useCancelAppointment } from '@/hooks/queries/useAppointments';
import { useUpdateProfile } from '@/hooks/queries/useProfile';
import {
  Calendar, Clock, MapPin, Loader2, Search, XCircle, User, Phone, Save,
  Star, Bell, ChevronRight, Building2, RefreshCw, Users, MapPinIcon
} from 'lucide-react';
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
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import type { AppointmentWithClinic } from '@/services/appointmentService';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isLoading: authLoading, isInitialized } = useAuthStore();
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'appointments';
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile'>(initialTab);

  useDocumentTitle(activeTab === 'profile' ? 'My Profile' : 'My Appointments');

  // Sync tab with URL params reactively (so header profile link works)
  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'profile' ? 'profile' : 'appointments');
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'past'>('all');

  const [profileForm, setProfileForm] = useState({ 
    name: '', 
    phone: '', 
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    age: '' as string,
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });
  const { data: appointments = [], isLoading, refetch: refetchAppointments } = useUserAppointments(user?.id);
  const cancelMutation = useCancelAppointment();
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      setProfileForm({ 
        name: profile.name || '', 
        phone: profile.phone || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          postal_code: profile.address?.postal_code || '',
          country: profile.address?.country || ''
        }
      });
    }
  }, [profile]);

  const cancelAppointment = (id: string) => { cancelMutation.mutate(id); };

  const saveProfile = () => {
    if (!profileForm.name.trim() || !user) return;
    
    const updateData: any = {
      name: profileForm.name.trim(), 
      phone: profileForm.phone.trim() || null,
    };

    // Add gender if provided
    if (profileForm.gender) {
      updateData.gender = profileForm.gender;
    }

    // Add age if provided and valid
    if (profileForm.age.trim()) {
      const ageNum = parseInt(profileForm.age.trim());
      if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 150) {
        updateData.age = ageNum;
      }
    }

    // Add address if any field is provided
    const hasAddressData = Object.values(profileForm.address).some(val => val.trim());
    if (hasAddressData) {
      updateData.address = Object.fromEntries(
        Object.entries(profileForm.address)
          .filter(([_, value]) => value.trim())
          .map(([key, value]) => [key, value.trim()])
      );
    }

    updateProfileMutation.mutate({
      userId: user.id,
      data: updateData,
    });
  };

  const upcomingAppointments = appointments.filter(
    (apt) => !isPast(parseISO(`${apt.date}T${apt.time}`)) || isToday(parseISO(apt.date))
  );
  const pastAppointments = appointments.filter(
    (apt) => isPast(parseISO(`${apt.date}T${apt.time}`)) && !isToday(parseISO(apt.date))
  );

  const filteredAppointments = (() => {
    if (statusFilter === 'all') return [...upcomingAppointments, ...pastAppointments];
    if (statusFilter === 'confirmed') return appointments.filter(a => a.status === 'confirmed');
    if (statusFilter === 'pending') return appointments.filter(a => a.status === 'pending');
    if (statusFilter === 'past') return pastAppointments;
    return appointments;
  })();

  if (authLoading || !isInitialized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="container max-w-[1000px] py-6 sm:py-8">
          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              {/* Header Row — stacks on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-[28px] sm:text-[34px] font-black text-slate-900 tracking-tight leading-tight">My Appointments</h1>
                  <p className="text-slate-500 font-medium mt-1 text-[14px] sm:text-base">Manage your clinical visits and healthcare schedule.</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex items-center gap-3 shrink-0 self-start">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[24px] sm:text-[28px] font-black text-slate-900 leading-none">{String(upcomingAppointments.length).padStart(2, '0')}</p>
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Upcoming Visits</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-primary">THIS MONTH</p>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {(['all', 'confirmed', 'pending', 'past'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-4 sm:px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-bold capitalize whitespace-nowrap transition-all ${statusFilter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/40'}`}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Appointment List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-10 sm:p-16 text-center">
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-[18px] font-black text-slate-500 mb-2">No appointments found</h3>
                  <p className="text-slate-400 mb-6 font-medium">Find a clinic and book your first appointment</p>
                  <Link to="/search" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
                    <Search className="h-4 w-4" /> Find Clinics
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(apt => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      isPast={pastAppointments.some(p => p.id === apt.id)}
                      onCancel={cancelAppointment}
                      onReviewDone={refetchAppointments}
                      onRescheduleDone={refetchAppointments}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="text-[26px] sm:text-[30px] font-black text-slate-900 mb-6">Your Profile</h1>
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* Basic Information */}
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Email</label>
                    <input 
                      value={user?.email || ''} 
                      disabled 
                      className="w-full px-4 py-3.5 bg-slate-100 border-2 border-slate-100 rounded-2xl text-[14px] font-medium text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 mb-4">Demographics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Gender</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          value={profileForm.gender}
                          onChange={e => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors appearance-none"
                        >
                          <option value="">Select gender (optional)</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Age</label>
                      <input
                        type="number"
                        min="0"
                        max="150"
                        value={profileForm.age}
                        onChange={e => setProfileForm({ ...profileForm, age: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                        placeholder="Enter your age (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 mb-4">Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Street Address</label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={profileForm.address.street}
                          onChange={e => setProfileForm({ 
                            ...profileForm, 
                            address: { ...profileForm.address, street: e.target.value }
                          })}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter street address (optional)"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">City</label>
                        <input
                          value={profileForm.address.city}
                          onChange={e => setProfileForm({ 
                            ...profileForm, 
                            address: { ...profileForm.address, city: e.target.value }
                          })}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter city (optional)"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">State</label>
                        <input
                          value={profileForm.address.state}
                          onChange={e => setProfileForm({ 
                            ...profileForm, 
                            address: { ...profileForm.address, state: e.target.value }
                          })}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter state (optional)"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Postal Code</label>
                        <input
                          value={profileForm.address.postal_code}
                          onChange={e => setProfileForm({ 
                            ...profileForm, 
                            address: { ...profileForm.address, postal_code: e.target.value }
                          })}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter postal code (optional)"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-extrabold text-slate-700 mb-2 block">Country</label>
                        <input
                          value={profileForm.address.country}
                          onChange={e => setProfileForm({ 
                            ...profileForm, 
                            address: { ...profileForm.address, country: e.target.value }
                          })}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-medium outline-none focus:border-primary transition-colors"
                          placeholder="Enter country (optional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={saveProfile} 
                  disabled={updateProfileMutation.isPending} 
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-70"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ─── Appointment Card ─── */
function AppointmentCard({ appointment, isPast = false, onCancel, onReviewDone, onRescheduleDone }: {
  appointment: AppointmentWithClinic;
  isPast?: boolean;
  onCancel?: (id: string) => void;
  onReviewDone?: () => void;
  onRescheduleDone?: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const canCancel = !isPast && (appointment.status === 'pending' || appointment.status === 'confirmed') && onCancel;
  const canReschedule = !isPast && (appointment.status === 'pending' || appointment.status === 'confirmed') && !!appointment.doctor_id;
  const canReview = isPast && appointment.status === 'confirmed';

  const statusConfig = {
    confirmed: { label: 'CONFIRMED', cls: 'bg-primary/10 text-primary border-primary/20' },
    pending: { label: 'PENDING APPROVAL', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    cancelled: { label: 'CANCELLED', cls: 'bg-red-50 text-red-500 border-red-100' },
  }[appointment.status] ?? { label: appointment.status, cls: 'bg-slate-100 text-slate-500 border-slate-100' };

  return (
    <>
      <div className={`bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 sm:p-5 transition-all hover:shadow-md ${isPast ? 'opacity-70' : ''}`}>
        {/* Top Row: Avatar + Info + Status */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <span className="text-[18px] sm:text-[20px] font-black text-white">{(appointment.clinics?.name || 'C').charAt(0)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-extrabold text-[15px] sm:text-[16px] text-slate-900 truncate">
                {appointment.doctors?.name ? `Dr. ${appointment.doctors.name}` : appointment.clinics?.name || 'Clinic'}
              </h3>
              <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${statusConfig.cls}`}>
                {statusConfig.label}
              </span>
            </div>
            {appointment.doctors?.specialization && (
              <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 mb-1">{appointment.doctors.specialization}</p>
            )}
            <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {appointment.clinics?.name}{appointment.clinics?.city ? `, ${appointment.clinics.city}` : ''}
            </p>
          </div>
        </div>

        {/* Date/Time + Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-50">
          {/* Date/Time */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px]">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-700">{format(parseISO(appointment.date), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px]">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="font-bold text-primary">{appointment.time.slice(0, 5)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {canReview && (
              <button onClick={() => setReviewOpen(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-slate-200 text-slate-700 font-bold text-[12px] sm:text-[13px] rounded-xl hover:bg-slate-50 transition-colors">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Review
              </button>
            )}
            {canReschedule && (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-slate-200 text-slate-600 font-bold text-[12px] sm:text-[13px] rounded-xl hover:bg-slate-50 hover:border-primary/30 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reschedule
              </button>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-red-100 bg-red-50 text-red-500 font-bold text-[12px] sm:text-[13px] rounded-xl hover:bg-red-100 transition-colors">
                    Cancel Visit
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[24px] border-slate-100 mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[20px] font-black">Cancel Appointment?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold">Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancel(appointment.id)} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold">
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="rounded-[24px] border-slate-100 mx-4">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black">Review {appointment.clinics?.name}</DialogTitle>
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

      {/* Reschedule Dialog */}
      <RescheduleDialog
        appointment={appointment}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={onRescheduleDone}
      />
    </>
  );
}
