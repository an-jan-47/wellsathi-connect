import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { format, parseISO, addDays } from 'date-fns';
import { ArrowLeft, Calendar, Clock, User, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import type { Clinic, TimeSlot } from '@/types';

const bookingSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().min(10, 'Please enter a valid phone number').max(15),
  notes: z.string().max(500).optional(),
});

export default function Book() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, isInitialized } = useAuthStore();

  // Require login
  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      toast.error('Please log in to book an appointment');
      navigate(`/auth?redirect=/book/${clinicId}`);
    }
  }, [user, authLoading, isInitialized, navigate, clinicId]);

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState(searchParams.get('time') || '');

  const [formData, setFormData] = useState({
    patientName: profile?.name || '',
    patientPhone: profile?.phone || '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form with profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        patientName: prev.patientName || profile.name || '',
        patientPhone: prev.patientPhone || profile.phone || '',
      }));
    }
  }, [profile]);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  useEffect(() => { if (clinicId) fetchClinic(); }, [clinicId]);
  useEffect(() => { if (clinicId) fetchSlots(); }, [clinicId, selectedDate]);

  const fetchClinic = async () => {
    try {
      const { data, error } = await supabase.from('clinics').select('*').eq('id', clinicId).maybeSingle();
      if (error) throw error;
      setClinic(data as Clinic);
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots').select('*')
        .eq('clinic_id', clinicId).eq('date', selectedDate).eq('is_available', true)
        .order('start_time');
      if (error) throw error;
      setSlots(data as TimeSlot[] || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      const validated = bookingSchema.parse(formData);
      setIsSubmitting(true);

      // Create appointment
      const { error: aptError } = await supabase.from('appointments').insert({
        clinic_id: clinicId,
        patient_name: validated.patientName,
        patient_phone: validated.patientPhone,
        date: selectedDate,
        time: selectedTime,
        notes: validated.notes || null,
        status: 'pending',
        user_id: user?.id || null,
      });
      if (aptError) throw aptError;

      // Mark slot as unavailable
      if (selectedSlotId) {
        await supabase.from('time_slots').update({ is_available: false }).eq('id', selectedSlotId);
      }

      setIsBooked(true);
      toast.success('Appointment booked successfully!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to book appointment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isBooked) {
    return (
      <Layout>
        <div className="container py-20">
          <Card variant="elevated" className="max-w-lg mx-auto text-center animate-scale-in">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-6">Your appointment has been booked. The clinic will confirm shortly.</p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="font-medium">{clinic.name}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span>{format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>{selectedTime.slice(0, 5)}</span></div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1"><Link to="/search">Find More Clinics</Link></Button>
                {user ? (
                  <Button asChild className="flex-1"><Link to="/dashboard/user">My Appointments</Link></Button>
                ) : (
                  <Button asChild className="flex-1"><Link to="/">Go Home</Link></Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <Link to={`/clinic/${clinicId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />Back to Clinic
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground mt-2">{clinic.name}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>Fill in your details to confirm the booking.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Date</label>
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

                  {/* Time Slots */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Time</label>
                    {slots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {slots.map((slot) => (
                          <button key={slot.id} type="button"
                            onClick={() => { setSelectedTime(slot.start_time); setSelectedSlotId(slot.id); }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedTime === slot.start_time ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}>
                            {slot.start_time.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center bg-muted/50 rounded-lg">No slots available for this date</p>
                    )}
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="patientName" placeholder="Enter your name" value={formData.patientName} onChange={handleChange} className="pl-11" />
                      </div>
                      {errors.patientName && <p className="text-sm text-destructive mt-1">{errors.patientName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="patientPhone" placeholder="Enter phone number" value={formData.patientPhone} onChange={handleChange} className="pl-11" />
                      </div>
                      {errors.patientPhone && <p className="text-sm text-destructive mt-1">{errors.patientPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                    <Textarea name="notes" placeholder="Any specific concerns..." value={formData.notes} onChange={handleChange} rows={3} />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !selectedTime}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card variant="elevated" className="sticky top-20">
              <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">{clinic.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{clinic.name}</p>
                    <p className="text-sm text-muted-foreground">{clinic.city}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(parseISO(selectedDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime ? selectedTime.slice(0, 5) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-bold text-primary">₹{clinic.fees}</span>
                  </div>
                </div>
                <Badge variant="pending" className="w-full justify-center py-2">Payment at Clinic</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
