import { useState, useMemo, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import {
  Loader2, Video, CheckCircle2, MapPin, Phone, Clock, Users, Award, Shield,
  Calendar, ChevronDown, Star, Navigation,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Doctor, Clinic, TimeSlot } from '@/types';
import { format, addDays, isToday as isTodayFn, parseISO } from 'date-fns';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';
import { ClinicHeroBanner } from '@/components/clinic/ClinicHeroBanner';
import { ClinicDoctorsGrid } from '@/components/clinic/ClinicDoctorsGrid';
import { ClinicMap } from '@/components/clinic/ClinicMap';

interface Service {
  id: string;
  service_name: string;
  fee: number;
}

interface DateOption {
  value: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}

export default function ClinicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('overview');

  const { data: profileData, isLoading } = useClinicProfile(id);
  const clinic = profileData?.clinic ?? null;
  const doctors = (profileData?.doctors ?? []) as Doctor[];

  useDocumentTitle(clinic ? `${clinic.name} – Book Appointment` : undefined);

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const { data: allSlots = [] } = useAllSlots(selectedDoctorId, selectedDate);
  const services = profileData?.services ?? [];

  const dateOptions: DateOption[] = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd'),
      month: format(date, 'MMM'),
      isToday: i === 0,
    };
  });

  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return allSlots;
    const currentTimeStr = format(new Date(), 'HH:mm:ss');
    return allSlots.filter((slot) => slot.start_time > currentTimeStr);
  }, [allSlots, selectedDate]);

  const handleBooking = () => {
    const targetUrl = `/book/${clinic?.id}?doctor=${selectedDoctorId}&date=${selectedDate}${selectedSlot ? `&time=${selectedSlot}` : ''}`;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(targetUrl);
    }
  };



  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] bg-[#fafafa]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#fafafa]">
          <h2 className="text-2xl font-black text-slate-800 mb-4">Clinic not found</h2>
          <Link to="/search" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90">
            Back to Directory
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#fafafa] font-sans">
        <div className="container max-w-[1200px] py-5 md:py-6 px-4">

          {/* ════════════════════════════════════════════════════
              LAYOUT: 2 columns  
              LEFT  = Hero image + scrollable content
              RIGHT = Booking + Map (STICKY — never scrolls)
          ════════════════════════════════════════════════════ */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

            {/* ─── LEFT COLUMN (scrolls) ─── */}
            <div className="flex-1 min-w-0 space-y-6 md:space-y-8">

              {/* Hero Image */}
              <div className="h-[234px] sm:h-[288px] lg:h-[414px]">
                <ClinicHeroBanner clinic={clinic} />
              </div>

              {/* Mobile Booking — directly below hero image */}
              <div className="lg:hidden">
                <BookingCard
                  clinic={clinic}
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  dateOptions={dateOptions}
                  filteredSlots={filteredSlots}
                  onDoctorChange={setSelectedDoctorId}
                  onDateChange={setSelectedDate}
                  onSlotChange={setSelectedSlot}
                  onBooking={handleBooking}
                />
              </div>



              {/* 1. Doctors — first section */}
              <section id="doctors">
                <ClinicDoctorsGrid doctors={doctors} onSelectDoctor={setSelectedDoctorId} />
              </section>

              {/* 2. Specialties */}
              {clinic.specializations && clinic.specializations.length > 0 && (
                <section id="overview" className="space-y-3">
                  <h3 className="text-[18px] font-black text-slate-900">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {clinic.specializations.map((spec) => (
                      <span key={spec} className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:border-primary/50 hover:text-primary transition-colors">
                        {spec}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Services & Pricing */}
              {services.length > 0 && (
                <section id="services" className="space-y-3">
                  <h2 className="text-[20px] md:text-[22px] font-black text-slate-900">Services & Pricing</h2>
                  <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden divide-y divide-slate-100">
                    {services.map((svc: Service) => (
                      <div key={svc.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-bold text-[13px] text-slate-700 truncate">{svc.service_name}</span>
                        </div>
                        <span className="font-black text-[15px] text-primary shrink-0 ml-3">₹{svc.fee}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Reviews */}
              <section id="reviews" className="w-full">
                <ClinicReviews clinicId={clinic.id} />
              </section>

              {/* 5. About Us (moved below reviews) */}
              <section className="space-y-4 pt-2">
                <h2 className="text-[20px] md:text-[22px] font-black text-slate-900">About Us</h2>
                <p className="text-[14px] md:text-[15px] text-slate-600 font-medium leading-relaxed">
                  {clinic.description ||
                    `Welcome to ${clinic.name}. We are dedicated to providing the highest standard of personalized medical care. Our state-of-the-art facility is equipped with modern diagnostic and therapeutic technology to ensure you receive accurate and effective treatments.`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard value={`${doctors.length || 1}+`} label="Specialists" icon={<Users className="w-4 h-4 text-primary" />} />
                  <StatCard value={clinic.specializations?.length ? `${clinic.specializations.length}` : '5+'} label="Specialties" icon={<Award className="w-4 h-4 text-primary" />} />
                  <StatCard value={clinic.rating ? Number(clinic.rating).toFixed(1) : '4.5'} label="Rating" icon={<Shield className="w-4 h-4 text-primary" />} />
                  <StatCard value="24/7" label="Support" icon={<Clock className="w-4 h-4 text-primary" />} />
                </div>
              </section>

              {/* 6. Virtual Care (moved below reviews) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-primary/8 to-primary/3 rounded-[18px] p-5 pt-8 border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="absolute top-0 left-0 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-br-xl">Coming Soon</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                    <Video className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900">24/7 Virtual Care</h3>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5 max-w-[260px]">Connect with our medical staff from home.</p>
                  </div>
                </div>
                <button className="bg-white/70 cursor-not-allowed text-primary px-5 py-2.5 rounded-xl font-bold text-[12px] border border-primary/10 shrink-0 w-full sm:w-auto">Start Visit</button>
              </div>

              {/* Mobile-only Location + Booking */}
              <section className="lg:hidden space-y-4">
                <LocationCard clinic={clinic} />
              </section>
            </div>

            {/* ─── RIGHT COLUMN (STICKY — booking + map stay fixed) ─── */}
            <div className="hidden lg:block w-[380px] shrink-0">
              <div className="sticky top-16 space-y-4" data-booking-widget>
                {/* Booking Card */}
                <BookingCard
                  clinic={clinic}
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  dateOptions={dateOptions}
                  filteredSlots={filteredSlots}
                  onDoctorChange={setSelectedDoctorId}
                  onDateChange={setSelectedDate}
                  onSlotChange={setSelectedSlot}
                  onBooking={handleBooking}
                />

                {/* Map / Location Card */}
                <LocationCard clinic={clinic} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════ */

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-[14px] px-4 py-3.5 text-center hover:shadow-sm transition-shadow min-h-[80px] flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-[20px] md:text-[22px] font-black text-primary leading-none">{value}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
    </div>
  );
}

function LocationCard({ clinic }: { clinic: Clinic }) {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}, ${clinic.city}`)}`;

  return (
    <div className="bg-white rounded-[20px] border border-slate-200/80 overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Visit Us</p>
        <h4 className="font-black text-slate-900 text-[16px]">Clinic Location</h4>
      </div>
      <div className="mx-3 mb-3 rounded-[14px] overflow-hidden border border-slate-100 aspect-[2/1] bg-slate-100">
        <ClinicMap clinics={[clinic]} />
      </div>
      <div className="px-5 pb-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-800 leading-snug">{clinic.address}</p>
            <p className="text-[11px] font-medium text-slate-400">{clinic.city}</p>
          </div>
        </div>
        {clinic.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <a href={`tel:${clinic.phone}`} className="text-[13px] font-bold text-slate-700 hover:text-primary transition-colors">{clinic.phone}</a>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-700">Mon – Sat</p>
            <p className="text-[11px] font-medium text-slate-400">09:00 AM – 08:00 PM</p>
          </div>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-[12px] py-3 rounded-xl transition-colors w-full shadow-md shadow-primary/20"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get Directions
        </a>
      </div>
    </div>
  );
}

/* ─── Booking Card ─── */
function BookingCard({
  doctors, selectedDoctorId, selectedDate, selectedSlot,
  dateOptions, filteredSlots,
  onDoctorChange, onDateChange, onSlotChange, onBooking,
}: {
  clinic: Clinic;
  doctors: Doctor[];
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlot: string;
  dateOptions: DateOption[];
  filteredSlots: TimeSlot[];
  onDoctorChange: (id: string) => void;
  onDateChange: (d: string) => void;
  onSlotChange: (t: string) => void;
  onBooking: () => void;
}) {
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 pt-7 pb-5 lg:py-5">
        <h3 className="text-[18px] font-black text-slate-900 mb-0.5">Book an Appointment</h3>

        {/* Doctor Selector */}
        <div className="mb-5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Doctor</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-primary/50 transition-colors rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 outline-none cursor-pointer">
                <span className="truncate">
                  {doctors.length === 0 ? 'No doctors available' : selectedDoctor ? `Dr. ${selectedDoctor.name} (${selectedDoctor.specialization})` : 'Select a Specialist'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl shadow-xl border-slate-100 p-1.5 max-h-[260px] overflow-y-auto" align="start">
              {doctors.length === 0 && <div className="p-3 text-center text-sm font-medium text-slate-500">No doctors available</div>}
              {doctors.map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => { onDoctorChange(d.id); onSlotChange(''); }}
                  className={`font-bold py-2.5 px-3 cursor-pointer rounded-lg mb-0.5 text-[13px] ${selectedDoctorId === d.id ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}
                >
                  Dr. {d.name} <span className="text-slate-400 ml-1 font-medium">({d.specialization})</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Date Bubbles */}
        <div className="mb-5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preferred Date</label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {dateOptions.slice(0, 7).map((option) => {
              const isSelected = selectedDate === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => { onDateChange(option.value); onSlotChange(''); }}
                  className={`flex flex-col items-center justify-center shrink-0 w-[56px] h-[66px] rounded-[14px] transition-all border-2 ${
                    isSelected
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-primary/40'
                  }`}
                >
                  <span className={`text-[9px] font-extrabold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{option.dayName}</span>
                  <span className="text-[18px] font-black leading-tight">{option.dayNum}</span>
                  <span className={`text-[8px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{option.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots — fixed min-height prevents layout shifts */}
        <div className="mb-5 min-h-[120px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Available Slots</label>
          {filteredSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
              {filteredSlots.map((slot) => {
                const isSelected = selectedSlot === slot.start_time;
                if (!slot.is_available) return null;
                return (
                  <button
                    key={slot.start_time}
                    onClick={() => onSlotChange(slot.start_time)}
                    className={`py-2.5 rounded-xl text-[12px] font-bold border-2 transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {slot.start_time.slice(0, 5)} {parseInt(slot.start_time) >= 12 ? 'PM' : 'AM'}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl py-5 text-center border border-slate-100">
              <Calendar className="w-5 h-5 text-slate-300 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-400">No slots available</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onBooking}
          disabled={!selectedSlot}
          className={`w-full py-3.5 rounded-xl font-black text-[14px] transition-all flex items-center justify-center gap-2 ${
            selectedSlot
              ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {selectedSlot ? 'Confirm Appointment' : 'Select a Time Slot'}
        </button>
      </div>

      <div className="bg-slate-50 px-5 py-2.5 text-center border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <Star className="w-3 h-3 fill-primary text-primary" /> Only Top-rated doctors on WellSathi
        </span>
      </div>
    </div>
  );
}
