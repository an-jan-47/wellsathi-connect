import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Star, IndianRupee, Clock, User, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import type { Clinic, Doctor, TimeSlot } from '@/types';
import { format, parseISO, addDays } from 'date-fns';

export default function ClinicProfile() {
  const { id } = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE, MMM d'),
      isToday: i === 0,
    };
  });

  useEffect(() => {
    if (id) {
      fetchClinicData();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSlots();
    }
  }, [id, selectedDate]);

  const fetchClinicData = async () => {
    try {
      const [clinicRes, doctorsRes] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', id).maybeSingle(),
        supabase.from('doctors').select('*').eq('clinic_id', id),
      ]);

      if (clinicRes.error) throw clinicRes.error;
      setClinic(clinicRes.data as Clinic);
      setDoctors(doctorsRes.data as Doctor[] || []);
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('clinic_id', id)
        .eq('date', selectedDate)
        .eq('is_available', true)
        .order('start_time');

      if (error) throw error;
      setSlots(data as TimeSlot[] || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold mb-4">Clinic not found</h2>
          <Button asChild>
            <Link to="/search">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="gradient-hero pb-0">
        <div className="container py-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </div>

        <div className="h-64 relative bg-muted">
          {clinic.image_url ? (
            <img
              src={clinic.image_url}
              alt={clinic.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-foreground/30">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </div>

      <div className="container -mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {clinic.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{clinic.address}, {clinic.city}</span>
                    </div>
                  </div>
                  {clinic.rating && clinic.rating > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent">
                      <Star className="h-5 w-5 text-warning fill-warning" />
                      <span className="font-bold">{Number(clinic.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <span className="font-semibold">₹{clinic.fees}</span>
                    <span className="text-muted-foreground">consultation</span>
                  </div>
                  {clinic.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                </div>

                {clinic.specializations && clinic.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clinic.specializations.map((spec) => (
                      <Badge key={spec} variant="accent">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}

                {clinic.description && (
                  <p className="mt-4 text-muted-foreground">{clinic.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Doctors */}
            {doctors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Our Doctors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                      >
                        <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary-foreground">
                            {doctor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card variant="elevated" className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Date
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedDate(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDate === option.value
                            ? 'gradient-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option.isToday ? 'Today' : option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Available Slots
                  </label>
                  {slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          size="sm"
                          asChild
                          className="justify-center"
                        >
                          <Link to={`/book/${clinic.id}?date=${selectedDate}&time=${slot.start_time}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {slot.start_time.slice(0, 5)}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/50 rounded-lg">
                      No slots available for this date
                    </p>
                  )}
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link to={`/book/${clinic.id}?date=${selectedDate}`}>
                    Book Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
