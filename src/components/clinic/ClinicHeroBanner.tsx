import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

export function ClinicHeroBanner({ clinic }: Props) {
  return (
    <div className="w-full h-[350px] md:h-[450px] relative bg-slate-200">
      {clinic.images && clinic.images.length > 0 ? (
        <img src={clinic.images[0]} alt={clinic.name} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-slate-200 flex items-center justify-center">
          <span className="text-8xl font-black text-white/40">{clinic.name.charAt(0)}</span>
        </div>
      )}

      {/* Top Gradient Overlay for Text Visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

      <div className="absolute top-6 left-6 md:left-12 z-10">
        <Link to="/search" className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all">
          <ArrowLeft className="h-4 w-4" /> Directory
        </Link>
      </div>

      <div className="absolute bottom-10 left-6 md:left-12 right-6 z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1400px] mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {clinic.rating && clinic.rating > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary rounded-lg text-white font-black text-[13px] shadow-lg shadow-primary/50/20">
                  <Star className="h-3.5 w-3.5 fill-white" />
                  {Number(clinic.rating).toFixed(1)}
                </div>
              )}
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white font-bold text-[12px] uppercase tracking-widest border border-white/20">
                Verified Clinic
              </span>
            </div>
            <h1 className="text-[36px] md:text-[54px] font-black text-white tracking-tight leading-none mb-2 drop-shadow-lg">
              {clinic.name}
            </h1>
            <div className="flex items-center gap-2 text-white/90 font-medium text-[16px] drop-shadow-md">
              <MapPin className="h-4 w-4" />
              {clinic.address}, {clinic.city}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
