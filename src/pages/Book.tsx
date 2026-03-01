import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { useBookAppointment } from '@/hooks/queries/useAppointments';
import { toast } from 'sonner';
import { format, parseISO, addDays, isToday as isTodayFn } from 'date-fns';
import {
  ArrowLeft, ArrowRight, Calendar, Clock, User, Phone, Mail,
  Loader2, IndianRupee, Stethoscope, Building2, Check, Edit2, CheckCircle2,
} from 'lucide-react';
import { z } from 'zod';
import { sortAlphaBy } from '@/lib/sortUtils';
import type { Doctor } from '@/types';

/* ───────────── validation schemas ───────────── */
const patientSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().regex(/^\+?[\d\s\-]{10,15}$/, 'Enter a valid phone number (10-15 chars, + and spaces allowed)'),
  patientEmail: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  notes: z.string().max(500).optional(),
});

/* ───────────── types ───────────── */
interface Service {
  id: string;
  service_name: string;
  fee: number;
}

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Select', 'Patient Info', 'Confirm'] as const;

/* ═══════════════════════════════════════════════ */
export default function Book() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  /* ── data fetching ── */
  const { data: clinicData, isLoading } = useClinicProfile(clinicId);
  const clinic = clinicData?.clinic;
  const doctors = (clinicData?.doctors ?? []) as Doctor[];
  const services = clinicData?.services ?? [];

  const sortedDoctors = useMemo(() => sortAlphaBy(doctors, 'name'), [doctors]);
  const sortedServices = useMemo(() => sortAlphaBy(services, 'service_name') as Service[], [services]);

  /* ── step state ── */
  const [step, setStep] = useState<Step>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRefId, setBookingRefId] = useState('');

  /* ── step 1 selections ── */
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '');

  const { data: slots = [], refetch: refetchSlots } = useAllSlots(clinicId, selectedDate);
  const bookMutation = useBookAppointment();

  /* ── step 2 form ── */
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* prefill from profile */
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        patientName: prev.patientName || profile.name || '',
        patientPhone: prev.patientPhone || profile.phone || '',
      }));
    }
  }, [profile]);

  /* ── derived data ── */
  const selectedDoctor = sortedDoctors.find(d => d.id === selectedDoctorId);
  const selectedServices = sortedServices.filter(s => selectedServiceIds.includes(s.id));
  const baseFee = selectedDoctor && (selectedDoctor.fee ?? 0) > 0 ? selectedDoctor.fee! : (clinic?.fees ?? 0);
  const totalFee = baseFee + selectedServices.reduce((sum, s) => sum + s.fee, 0);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return slots;
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return slots.filter(slot => slot.start_time > currentTimeStr);
  }, [slots, selectedDate]);

  /* ── handlers ── */
  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const canProceedStep1 = selectedTime && selectedSlotId;

  const goToStep2 = () => {
    if (!canProceedStep1) {
      toast.error('Please select a date and time slot');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep3 = () => {
    try {
      patientSchema.parse(formData);
      setErrors({});
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleConfirm = () => {
    if (!clinicId || !selectedSlotId) return;

    bookMutation.mutate({
      clinicId,
      slotId: selectedSlotId,
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      date: selectedDate,
      time: selectedTime,
      notes: formData.notes || null,
      doctorId: selectedDoctorId || null,
      totalFee,
      serviceIds: selectedServiceIds,
    }, {
      onSuccess: (appointmentId) => {
        setBookingRefId(appointmentId?.slice(0, 8).toUpperCase() || 'CONFIRMED');
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        if (error.message.includes('no longer available')) {
          toast.error('This slot was just booked by someone else. Please choose another.');
          refetchSlots();
          setStep(1);
        } else {
          toast.error('Failed to book appointment. Please try again.');
        }
      },
    });
  };

  /* ── loading / not found ── */
  if (isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!clinic) {
    return (
      <Layout><div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Clinic not found</h2>
        <Button asChild><Link to="/search"><ArrowLeft className="h-4 w-4 mr-2" />Back to Search</Link></Button>
      </div></Layout>
    );
  }

  /* ── success screen ── */
  if (isSuccess) {
    return (
      <Layout>
        <div className="container py-20 max-w-lg mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-2">Your appointment has been successfully booked.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent mb-6">
            <span className="text-sm text-muted-foreground">Reference ID:</span>
            <span className="font-bold text-primary tracking-wider">{bookingRefId}</span>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Clinic</span><span className="font-medium">{clinic.name}</span></div>
            {selectedDoctor && <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium">{selectedDoctor.name}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(parseISO(selectedDate), 'MMM d, yyyy')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime.slice(0, 5)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">₹{totalFee}</span></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/user')}>My Appointments</Button>
            <Button className="flex-1" onClick={() => navigate('/', { replace: true })}>Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════ */
  return (
    <Layout>
      {/* Header */}
      <div className="gradient-hero py-6">
        <div className="container">
          <Link to={`/clinic/${clinicId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" />Back to Clinic
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground mt-1">{clinic.name}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="container py-4">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
                    isDone ? 'bg-green-500 text-white' : isActive ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`h-0.5 w-full mx-2 rounded ${isDone ? 'bg-green-500' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main content ── */}
          <div className="lg:col-span-2">
            {/* ═══ STEP 1: SELECT ═══ */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Doctor Selection */}
                {sortedDoctors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Doctor</CardTitle>
                      <CardDescription>Choose a doctor for your appointment (optional)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sortedDoctors.map((doctor) => (
                          <button
                            key={doctor.id}
                            type="button"
                            onClick={() => setSelectedDoctorId(prev => prev === doctor.id ? '' : doctor.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                              selectedDoctorId === doctor.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="h-11 w-11 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary-foreground">{doctor.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{doctor.name}</p>
                              <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                              {(doctor.experience_years ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground">{doctor.experience_years}+ yrs exp.</p>
                              )}
                              {(doctor.fee ?? 0) > 0 && (
                                <p className="text-xs font-semibold text-primary mt-0.5">₹{doctor.fee}</p>
                              )}
                            </div>
                            {selectedDoctorId === doctor.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Multi-Service Selection */}
                {sortedServices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Services</CardTitle>
                      <CardDescription>Choose one or more services</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sortedServices.map((service) => (
                          <label
                            key={service.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                              selectedServiceIds.includes(service.id) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedServiceIds.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <span className="flex-1 font-medium text-sm">{service.service_name}</span>
                            <span className="font-semibold text-primary text-sm">₹{service.fee}</span>
                          </label>
                        ))}
                      </div>
                      {selectedServices.length > 0 && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                          <span className="text-sm text-muted-foreground">{selectedServices.length} service(s) selected</span>
                          <span className="font-bold text-primary">Total: ₹{selectedServices.reduce((s, svc) => s + svc.fee, 0)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Date Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date & Time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                      <div className="flex flex-wrap gap-2">
                        {dateOptions.map((option) => (
                          <button key={option.value} type="button"
                            onClick={() => { setSelectedDate(option.value); setSelectedTime(''); setSelectedSlotId(''); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedDate === option.value ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}>
                            {option.isToday ? 'Today' : option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Time Slot</label>
                      {filteredSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {filteredSlots.map((slot) => (
                            <button key={slot.id} type="button"
                              disabled={!slot.is_available}
                              onClick={() => { if (slot.is_available) { setSelectedTime(slot.start_time); setSelectedSlotId(slot.id); } }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                !slot.is_available
                                  ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed line-through'
                                  : selectedTime === slot.start_time
                                    ? 'gradient-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                              }`}>
                              {slot.start_time.slice(0, 5)}
                              {!slot.is_available && <span className="block text-[10px] opacity-60">Booked</span>}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center bg-muted/50 rounded-lg">No slots available for this date</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button size="lg" className="w-full" disabled={!canProceedStep1} onClick={goToStep2}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ═══ STEP 2: PATIENT INFO ═══ */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Enter patient details for this appointment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input name="patientName" placeholder="Enter your name" value={formData.patientName} onChange={handleChange} className="pl-11" />
                        </div>
                        {errors.patientName && <p className="text-sm text-destructive mt-1">{errors.patientName}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input name="patientPhone" placeholder="10-digit number" value={formData.patientPhone} onChange={handleChange} className="pl-11" />
                        </div>
                        {errors.patientPhone && <p className="text-sm text-destructive mt-1">{errors.patientPhone}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="patientEmail" placeholder="your@email.com" value={formData.patientEmail} onChange={handleChange} className="pl-11" />
                      </div>
                      {errors.patientEmail && <p className="text-sm text-destructive mt-1">{errors.patientEmail}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                      <Textarea name="notes" placeholder="Any specific concerns or symptoms..." value={formData.notes} onChange={handleChange} rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button size="lg" className="flex-1" onClick={goToStep3}>
                    Review & Confirm <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: CONFIRMATION ═══ */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Review & Confirm</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Clinic */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary-foreground">{clinic.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{clinic.name}</p>
                        <p className="text-xs text-muted-foreground">{clinic.address}, {clinic.city}</p>
                      </div>
                    </div>

                    {/* Doctor */}
                    {selectedDoctor && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary-foreground">{selectedDoctor.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedDoctor.specialization}</p>
                        </div>
                      </div>
                    )}

                    {/* Fees Breakdown */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Fees Breakdown</p>
                      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                        <div className="flex justify-between items-center px-3 py-2 text-sm bg-muted/30">
                          <span>Consultation Fee</span>
                          <span className="font-medium">₹{baseFee}</span>
                        </div>
                        {selectedServices.map(svc => (
                          <div key={svc.id} className="flex justify-between items-center px-3 py-2 text-sm">
                            <span>{svc.service_name}</span>
                            <span className="font-medium">₹{svc.fee}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="font-semibold text-sm">{format(parseISO(selectedDate), 'EEE, MMM d, yyyy')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <p className="font-semibold text-sm">{selectedTime.slice(0, 5)}</p>
                      </div>
                    </div>

                    {/* Patient */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Patient Details</p>
                      <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{formData.patientName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{formData.patientPhone}</span></div>
                        {formData.patientEmail && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{formData.patientEmail}</span></div>}
                        {formData.notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="font-medium truncate max-w-[200px]">{formData.notes}</span></div>}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="font-medium text-foreground">Total Amount</span>
                      <span className="text-xl font-bold text-primary">₹{totalFee}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={bookMutation.isPending}
                    onClick={handleConfirm}
                  >
                    {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div>
            <Card variant="elevated" className="sticky top-20">
              <CardHeader><CardTitle className="text-lg">Booking Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary-foreground">{clinic.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{clinic.name}</p>
                    <p className="text-xs text-muted-foreground">{clinic.city}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  {selectedDoctor && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium truncate max-w-[140px]">{selectedDoctor.name}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Consultation</span><span>₹{baseFee}</span></div>

                  {selectedServices.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Services</span>
                      <div className="mt-1 space-y-1">
                        {selectedServices.map(s => (
                          <div key={s.id} className="flex justify-between text-xs">
                            <span className="text-muted-foreground truncate max-w-[120px]">{s.service_name}</span>
                            <span>₹{s.fee}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(parseISO(selectedDate), 'MMM d, yyyy')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime ? selectedTime.slice(0, 5) : '—'}</span></div>
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">₹{totalFee}</span>
                </div>

                {/* Payment Method */}
                <div className="border-t border-border pt-3">
                  <label className="text-sm font-medium text-foreground mb-2 block">Payment</label>
                  <div className="rounded-xl border-2 border-primary bg-primary/5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">Pay at Clinic</p>
                        <p className="text-xs text-muted-foreground">Pay when you visit</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
