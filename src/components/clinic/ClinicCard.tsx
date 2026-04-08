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
    let cancelled = false;

    async function fetchNextSlot() {
      try {
        const { data: doctors } = await supabase
          .from('doctors')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1);

        if (!doctors?.length) return;

        const firstDoctorId = doctors[0].id;
        const today = new Date().toISOString().split('T')[0];

        const { data: slots, error } = await supabase.rpc('get_doctor_slots', {
          p_doctor_id: firstDoctorId,
          p_date: today,
        });

        if (!error && slots?.length) {
          const availableSlot = (slots as any[]).find((s) => s.is_available);
          if (availableSlot && !cancelled) {
            setNextSlot(`Today, ${formatTime(availableSlot.start_time)}`);
            return;
          }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { data: tmrwSlots, error: tmrwError } = await supabase.rpc(
          'get_doctor_slots',
          { p_doctor_id: firstDoctorId, p_date: tomorrowStr }
        );

        if (!tmrwError && tmrwSlots?.length) {
          const availableTmrw = (tmrwSlots as any[]).find(
            (s) => s.is_available
          );
          if (availableTmrw && !cancelled) {
            setNextSlot(`Tomorrow, ${formatTime(availableTmrw.start_time)}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch slot', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNextSlot();
    return () => { cancelled = true; };
  }, [clinicId]);

  if (loading) {
    return (
      <span className="text-slate-300 animate-pulse bg-slate-100 rounded w-20 h-4 inline-block" />
    );
  }
  if (!nextSlot) {
    return (
      <span className="text-slate-400 text-[12px] font-medium">
        No slots today
      </span>
    );
  }

  return (
    <span className="text-slate-800 text-[12px] font-bold">{nextSlot}</span>
  );
}

/* ─── Badge Components ─── */
function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const cls =
    size === 'xs'
      ? 'gap-1 px-1.5 py-0.5 text-[9px]'
      : 'gap-1.5 px-2 py-0.5 text-[10px]';
  return (
    <div
      className={`flex items-center rounded-md bg-emerald-50 border border-emerald-100/60 ${cls}`}
    >
      <CheckCircle2
        className={
          size === 'xs'
            ? 'w-2.5 h-2.5 text-emerald-600'
            : 'w-3 h-3 text-emerald-600'
        }
      />
      <span className="font-bold text-emerald-700 uppercase tracking-wider leading-none">
        Verified
      </span>
    </div>
  );
}

function TopRatedBadge({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const cls =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px]'
      : 'px-2 py-0.5 text-[10px]';
  return (
    <div
      className={`rounded-md bg-amber-50 border border-amber-100/60 ${cls}`}
    >
      <span className="font-bold text-amber-700 uppercase tracking-wider leading-none">
        Top Rated
      </span>
    </div>
  );
}

export function ClinicCard({ clinic, layout = 'horizontal' }: ClinicCardProps) {
  const isVertical = layout === 'vertical';
  const isTopRated = (clinic.rating ?? 0) > 4;
  const hasRating = (clinic.rating ?? 0) > 0;

  return (
    <Link
      to={`/clinic/${clinic.id}`}
      className={`bg-white focus-visible:outline-none focus:ring-4 ring-primary/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100/80 p-3 sm:p-4 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08)] hover:border-slate-200/80 transition-all duration-300 group block ${isVertical ? 'h-full flex flex-col' : ''}`}
    >
      <div
        className={`flex gap-3.5 sm:gap-5 ${
          isVertical
            ? 'flex-col flex-1'
            : 'flex-col sm:flex-row'
        }`}
      >
        {/* ─── Image ─── */}
        <div
          className={`relative shrink-0 rounded-[16px] overflow-hidden bg-slate-100 ${
            isVertical
              ? 'w-full aspect-[16/10]'
              : 'w-full sm:w-[260px] h-[180px] sm:h-auto sm:min-h-[200px]'
          }`}
        >
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
              <span className="text-4xl font-black text-primary/30">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Rating Badge — always on image top-right */}
          {hasRating && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md shadow-sm flex items-center gap-1 px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[13px] font-black text-slate-800 leading-none">
                {Number(clinic.rating).toFixed(1)}
              </span>
            </div>
          )}

          {/* Mobile badges — top-left on image */}
          <div className="absolute top-3 left-3 flex sm:hidden items-center gap-1.5">
            <VerifiedBadge size="xs" />
            {isTopRated && <TopRatedBadge size="xs" />}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Top section */}
          <div>
            {/* Title row + Desktop badges */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-black text-[18px] sm:text-[20px] text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {clinic.name}
              </h3>
              {/* Desktop badges — parallel to clinic name */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 mt-0.5">
                <VerifiedBadge />
                {isTopRated && <TopRatedBadge />}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-slate-500 mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              <span className="text-[12px] sm:text-[13px] font-medium line-clamp-1">
                {clinic.address}, {clinic.city}
              </span>
            </div>

            {/* Specialties */}
            {clinic.specializations && clinic.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {clinic.specializations.slice(0, 3).map((spec) => (
                  <span
                    key={spec}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[11px] font-semibold text-slate-600"
                  >
                    {spec}
                  </span>
                ))}
                {clinic.specializations.length > 3 && (
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[11px] font-semibold text-slate-500">
                    +{clinic.specializations.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom bar: Price + Slot + CTA */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100/80 mt-auto">
            {/* Left: fee + slot */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Fee */}
              {(clinic.fees ?? 0) > 0 && (
                <div className="shrink-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                    From
                  </p>
                  <p className="text-[16px] sm:text-[17px] font-black text-slate-900 leading-none">
                    ₹{clinic.fees}
                  </p>
                </div>
              )}

              {/* Divider */}
              {(clinic.fees ?? 0) > 0 && (
                <div className="w-px h-7 bg-slate-100 shrink-0" />
              )}

              {/* Next slot */}
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                  Next Slot
                </p>
                <NextAvailableSlot clinicId={clinic.id} />
              </div>
            </div>

            {/* CTA */}
            <span className="shrink-0 bg-primary text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-transform whitespace-nowrap">
              Book Visit
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
