import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, CheckCircle2, IndianRupee } from 'lucide-react';
import type { Clinic } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ClinicCardProps {
  clinic: Clinic;
  layout?: 'horizontal' | 'vertical';
}

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function NextAvailableSlot({ clinicId }: { clinicId: string }) {
  const [nextSlot, setNextSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextSlot() {
      try {
        const { data: doctors } = await supabase.from('doctors').select('id').eq('clinic_id', clinicId).limit(1);
        
        if (doctors && doctors.length > 0) {
          const firstDoctorId = doctors[0].id;
          const today = new Date().toISOString().split('T')[0];
          
          const { data: slots, error } = await supabase.rpc('get_doctor_slots', {
            p_doctor_id: firstDoctorId,
            p_date: today
          });

          if (!error && slots && slots.length > 0) {
            const availableSlot = (slots as any[]).find(s => s.is_available);
            if (availableSlot) {
              setNextSlot(`Today, ${formatTime(availableSlot.start_time)}`);
              return;
            }
          }
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          const { data: tmrwSlots, error: tmrwError } = await supabase.rpc('get_doctor_slots', {
            p_doctor_id: firstDoctorId,
            p_date: tomorrowStr
          });

          if (!tmrwError && tmrwSlots && tmrwSlots.length > 0) {
            const availableTmrw = (tmrwSlots as any[]).find(s => s.is_available);
            if (availableTmrw) {
              setNextSlot(`Tomorrow, ${formatTime(availableTmrw.start_time)}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch slot', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNextSlot();
  }, [clinicId]);

  if (loading) return <span className="text-slate-300 animate-pulse bg-slate-100 rounded w-24 h-5 inline-block"></span>;
  if (!nextSlot) return <span className="text-slate-400 font-medium">No slots available</span>;
  
  return <span className="text-slate-900 font-bold">{nextSlot}</span>;
}

export function ClinicCard({ clinic, layout = 'horizontal' }: ClinicCardProps) {
  const isVertical = layout === 'vertical';

  return (
    <Link 
      to={`/clinic/${clinic.id}`} 
      className={`bg-white focus-visible:outline-none focus:ring-4 ring-primary/20 rounded-[32px] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.03)] border border-slate-100/60 p-4 sm:p-5 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300 group block ${isVertical ? 'h-full flex flex-col' : ''}`}
    >
      <div className={`flex gap-5 sm:gap-7 min-h-[220px] sm:min-h-[260px] ${isVertical ? 'flex-col flex-1' : 'flex-col sm:flex-row'}`}>
        
        {/* Left Side: Image */}
        <div className={`relative shrink-0 rounded-[20px] overflow-hidden bg-slate-100 ${isVertical ? 'w-full aspect-[4/3]' : 'w-full sm:w-[300px] h-[220px] sm:h-auto'}`}>
          {clinic.images && clinic.images.length > 0 ? (
            <img
              src={clinic.images[0]}
              alt={clinic.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/10 to-slate-100 flex items-center justify-center">
              <span className="text-5xl font-black text-primary/30">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Top Right Rating Badge - Always on Image */}
          {clinic.rating && clinic.rating > 0 ? (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md shadow-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full">
               <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
               <span className="text-[14px] font-black text-slate-800 leading-none mt-[1px]">{Number(clinic.rating).toFixed(1)}</span>
            </div>
          ) : null}

          {/* Badges on Image strictly for Mobile ONLY */}
          <div className="absolute top-4 left-4 flex sm:hidden flex-col gap-2 items-start">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/95 backdrop-blur-sm shadow-sm border border-emerald-100/60">
                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                 <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
              </div>
              {clinic.rating && clinic.rating > 4 ? (
                <div className="px-2.5 py-1 rounded-md bg-amber-50/95 backdrop-blur-sm shadow-sm border border-amber-100/60">
                   <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider">Top Rated</span>
                </div>
              ) : null}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col justify-between py-1">
          
          <div>
            {/* Title & Badges */}
            <div className="flex flex-col gap-1.5 items-start mb-4">
                <h3 className="font-black text-[22px] sm:text-[24px] text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {clinic.name}
                </h3>
                {/* Badges strictly for Desktop (sm:flex hidden on mobile) */}
                <div className="hidden sm:flex items-center gap-2 mt-1">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100/60 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
                   </div>
                   {clinic.rating && clinic.rating > 4 ? (
                     <div className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100/60 transition-colors">
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Top Rated</span>
                     </div>
                   ) : null}
                </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <MapPin className="h-4.5 w-4.5 shrink-0 stroke-[2.5]" />
              <span className="text-[14px] font-medium line-clamp-1">{clinic.address}, {clinic.city}</span>
            </div>

            {/* Specialties & Price Row */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Specialties */}
              {clinic.specializations && clinic.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {clinic.specializations.slice(0, 3).map((spec) => (
                    <span key={spec} className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-full text-[12.5px] font-semibold text-slate-600">
                      {spec}
                    </span>
                  ))}
                  {clinic.specializations.length > 3 && (
                    <span className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-full text-[12.5px] font-semibold text-slate-600">
                      +{clinic.specializations.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {/* Price Indicator Prominent */}
              {clinic.fees && clinic.fees > 0 ? (
                 <div className="flex items-center gap-2.5 mt-1 w-fit">
                    <span className="text-[14px] font-semibold text-slate-500">Starts at</span>
                    <span className="text-[18px] font-black tracking-tight text-slate-900 bg-slate-100/80 px-3 py-0.5 rounded-lg border border-slate-200/50">₹{clinic.fees}</span>
                 </div>
              ) : null}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-5 border-t border-slate-100/60 gap-4 sm:gap-0">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold tracking-[0.08em] text-slate-400 uppercase mb-1">Next Available Slot</span>
              <div className="flex items-center gap-2">
                <NextAvailableSlot clinicId={clinic.id} />
              </div>
            </div>
            
            <div className="flex w-full sm:w-auto">
               <span className="w-full sm:w-auto bg-primary text-white font-black text-[15px] px-8 py-3.5 rounded-[14px] shadow-[0_8px_20px_-6px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center active:scale-95 transition-transform">
                 Book Visit
               </span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
