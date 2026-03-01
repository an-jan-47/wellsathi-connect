import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { MapPin, Phone, Star, IndianRupee, Clock, User, Loader2, ArrowLeft, Calendar, Stethoscope, MessageSquare } from 'lucide-react';
import type { Doctor } from '@/types';
import { format, addDays, isToday as isTodayFn, parseISO } from 'date-fns';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';

interface Service {
  id: string;
  service_name: string;
  fee: number;
}

export default function ClinicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: profileData, isLoading } = useClinicProfile(id);
  const { data: allSlots = [] } = useAllSlots(id, selectedDate);

  const clinic = profileData?.clinic ?? null;
  const doctors = (profileData?.doctors ?? []) as Doctor[];
  const services = profileData?.services ?? [];

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE, MMM d'), isToday: i === 0 };
  });

  // Filter out past slots for same-day
  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return allSlots;

    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return allSlots.filter(slot => slot.start_time > currentTimeStr);
  }, [allSlots, selectedDate]);

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

  return (
    <Layout>
      <div className="gradient-hero pb-0">
        <div className="container py-6">
          <Link to="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />Back to Search
          </Link>
        </div>
        <div className="h-64 relative bg-muted">
          {clinic.image_url ? (
            <img src={clinic.image_url} alt={clinic.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-foreground/30">{clinic.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </div>

      <div className="container -mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{clinic.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /><span>{clinic.address}, {clinic.city}</span>
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
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span>{clinic.phone}</span></div>
                  )}
                </div>
                {clinic.specializations && clinic.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clinic.specializations.map((spec) => <Badge key={spec} variant="accent">{spec}</Badge>)}
                  </div>
                )}
                {clinic.description && <p className="mt-4 text-muted-foreground">{clinic.description}</p>}
              </CardContent>
            </Card>

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" />Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {services.map((svc: Service) => (
                      <div key={svc.id} className="flex items-center justify-between py-3">
                        <span className="font-medium">{svc.service_name}</span>
                        <span className="font-semibold text-primary">₹{svc.fee}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Doctors */}
            {doctors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Our Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary-foreground">{doctor.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          {doctor.experience_years && doctor.experience_years > 0 && (
                            <p className="text-xs text-muted-foreground">{doctor.experience_years} years experience</p>
                          )}
                          {doctor.bio && <p className="text-sm text-muted-foreground mt-1">{doctor.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Patient Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClinicReviews clinicId={clinic.id} />
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card variant="elevated" className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Book Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Select Date</label>
                  <div className="flex flex-wrap gap-2">
                    {dateOptions.map((option) => (
                      <button key={option.value} onClick={() => setSelectedDate(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDate === option.value ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}>
                        {option.isToday ? 'Today' : option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Available Slots</label>
                  {filteredSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          size="sm"
                          disabled={!slot.is_available}
                          className={`justify-center ${
                            !slot.is_available ? 'opacity-50 cursor-not-allowed line-through' : ''
                          }`}
                          onClick={() => {
                            if (slot.is_available) {
                              if (!user) {
                                navigate(`/auth?redirect=/book/${clinic.id}?date=${selectedDate}&time=${slot.start_time}`);
                              } else {
                                navigate(`/book/${clinic.id}?date=${selectedDate}&time=${slot.start_time}`);
                              }
                            }
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />{slot.start_time.slice(0, 5)}
                          {!slot.is_available && <span className="ml-1 text-[10px]">(Booked)</span>}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/50 rounded-lg">No slots available</p>
                  )}
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      navigate(`/auth?redirect=/book/${clinic.id}?date=${selectedDate}`);
                    } else {
                      navigate(`/book/${clinic.id}?date=${selectedDate}`);
                    }
                  }}
                >
                  {user ? 'Book Now' : 'Login to Book'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
