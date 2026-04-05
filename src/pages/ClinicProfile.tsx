import { useState, useMemo, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useClinicProfile } from '@/hooks/queries/useClinics';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { Loader2, Video, CheckCircle2 } from 'lucide-react';
import type { Doctor } from '@/types';
import { format, addDays, isToday as isTodayFn, parseISO } from 'date-fns';
import { ClinicReviews } from '@/components/clinic/ClinicReviews';
import { ClinicHeroBanner } from '@/components/clinic/ClinicHeroBanner';
import { ClinicDoctorsGrid } from '@/components/clinic/ClinicDoctorsGrid';
import { ClinicBookingWidget } from '@/components/clinic/ClinicBookingWidget';

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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

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

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
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
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm:ss');
    return allSlots.filter(slot => slot.start_time > currentTimeStr);
  }, [allSlots, selectedDate]);

  const handleBooking = () => {
    const targetUrl = `/book/${clinic?.id}?doctor=${selectedDoctorId}&date=${selectedDate}${selectedSlot ? `&time=${selectedSlot}` : ''}`;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(targetUrl);
    }
  };

  /* ── Loading / Not Found ── */
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] bg-[#fafafa]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

        <ClinicHeroBanner clinic={clinic} />

        {/* 2-Column Main Content */}
        <div className="container max-w-[1400px] py-10">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Left Column (Details) */}
            <div className="flex-1 min-w-0 space-y-12">

              {/* Internal Nav */}
              <div className="flex items-center gap-8 border-b border-slate-200 pb-4 overflow-x-auto no-scrollbar">
                <a href="#overview" className="text-primary font-black text-[15px] border-b-2 border-primary pb-4 -mb-[18px] whitespace-nowrap">Overview</a>
                <a href="#services" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Services</a>
                <a href="#doctors" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Doctors</a>
                <a href="#reviews" className="text-slate-500 hover:text-slate-800 font-bold text-[15px] pb-4 -mb-[18px] transition-colors whitespace-nowrap">Reviews</a>
              </div>

              {/* About */}
              <div id="overview" className="space-y-4">
                <h2 className="text-[26px] font-black text-slate-900">About the Sanctuary</h2>
                <p className="text-[16px] text-slate-600 font-medium leading-relaxed">
                  {clinic.description || `Welcome to ${clinic.name}. We are dedicated to providing the highest standard of personalized medical care. Our state-of-the-art facility is equipped with modern diagnostic and therapeutic technology to ensure you receive accurate and effective treatments.`}
                </p>
              </div>

              {/* Virtual Care Support Card */}
              <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 rounded-[24px] p-8 pb-7 pt-[38px] border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.05)] transition-shadow">
                <div className="absolute top-0 left-0 bg-[#008a6e] text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-br-2xl shadow-sm z-10 py-1.5">
                  Coming Soon
                </div>
                <div className="flex items-center gap-5 mt-2">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/50/30 shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[19px] font-extrabold text-slate-900">24/7 Virtual Care Support</h3>
                    <p className="text-[14px] font-medium text-slate-900/70 mt-1 max-w-[300px]">
                      Connect with our medical staff instantly from the comfort of your home.
                    </p>
                  </div>
                </div>
                <button className="bg-white/60 cursor-not-allowed text-primary px-6 py-3.5 rounded-xl font-bold text-[14px] shrink-0 border border-primary/10 shadow-sm w-full md:w-auto mt-2">
                  Start Virtual Visit
                </button>
              </div>

              {/* Specialties */}
              {clinic.specializations && clinic.specializations.length > 0 && (
                <div className="space-y-5 pt-4">
                  <h3 className="text-[20px] font-black text-slate-900">Specialties</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {clinic.specializations.map((spec) => (
                      <span key={spec} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[14.5px] font-bold text-slate-700 shadow-sm hover:border-primary hover:text-primary transition-colors cursor-default">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors */}
              <ClinicDoctorsGrid
                doctors={doctors}
                onSelectDoctor={setSelectedDoctorId}
              />

              {/* Services List */}
              {services.length > 0 && (
                <div id="services" className="space-y-6 pt-4">
                  <h2 className="text-[26px] font-black text-slate-900">Services & Pricing</h2>
                  <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
                    {services.map((svc: Service, i) => (
                      <div key={svc.id} className={`flex items-center justify-between p-5 ${i !== services.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <span className="font-bold text-[15px] text-slate-700">{svc.service_name}</span>
                        </div>
                        <span className="font-black text-[18px] text-primary">₹{svc.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div id="reviews" className="pt-8 w-full block">
                <ClinicReviews clinicId={clinic.id} />
              </div>

            </div>

            {/* Right Column (Floating Reservation Widget) */}
            <ClinicBookingWidget
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
        </div>

      </div>
    </Layout>
  );
}
