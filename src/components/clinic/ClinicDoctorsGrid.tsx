import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Briefcase, GraduationCap, Stethoscope } from 'lucide-react';
import type { Doctor } from '@/types';

interface Props {
  doctors: Doctor[];
  onSelectDoctor: (doctorId: string) => void;
}

export function ClinicDoctorsGrid({ doctors, onSelectDoctor }: Props) {
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);

  if (doctors.length === 0) return null;

  return (
    <div id="doctors" className="space-y-4">
      <h2 className="text-[20px] md:text-[22px] font-black text-slate-900">Our Specialists</h2>

      {/* 3 cols desktop, 2 cols mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onViewProfile={() => setProfileDoctor(doctor)}
          />
        ))}
      </div>

      {/* Full Profile Dialog */}
      {profileDoctor && (
        <DoctorProfileDialog
          doctor={profileDoctor}
          open={!!profileDoctor}
          onOpenChange={(open) => { if (!open) setProfileDoctor(null); }}
          onBook={() => {
            onSelectDoctor(profileDoctor.id);
            setProfileDoctor(null);
            document.querySelector('[data-booking-widget]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}

/* ─── Doctor Card ─── */
function DoctorCard({ doctor, onViewProfile }: { doctor: Doctor; onViewProfile: () => void }) {
  const bio = doctor.bio || `Specializing in ${doctor.specialization.toLowerCase()} with a patient-centered approach.`;
  const shortBio = bio.length > 70 ? bio.slice(0, 70).trimEnd() + '…' : bio;
  const showReadMore = bio.length > 70;

  return (
    <button
      onClick={onViewProfile}
      className="bg-white border border-slate-200/80 rounded-[14px] sm:rounded-[16px] overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group text-left w-full flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {/* Avatar banner — 10% taller */}
      <div className="h-[88px] sm:h-[110px] bg-gradient-to-br from-primary/15 to-primary/5 relative flex items-end">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[40px] sm:text-[48px] font-black text-primary/15 select-none">
            {doctor.name.charAt(0)}
          </span>
        </div>
        {/* Specialization badge */}
        <div className="relative z-10 mx-2.5 sm:mx-3 mb-2.5 sm:mb-3">
          <span className="px-2 py-0.5 bg-primary text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
            {doctor.specialization}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
        {/* Name row + Experience */}
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <h4 className="font-black text-[13px] sm:text-[14px] text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-1">
            Dr. {doctor.name}
          </h4>
          {doctor.experience_years && (
            <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/8 rounded-md">
              <Briefcase className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] sm:text-[10px] font-bold text-primary whitespace-nowrap">
                {doctor.experience_years}y
              </span>
            </span>
          )}
        </div>

        {/* Bio — max 2 lines */}
        <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-1">
          {shortBio}
        </p>
        {showReadMore && (
          <span className="text-[10px] sm:text-[11px] font-bold text-primary">
            Read more →
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Full Profile Dialog ─── */
function DoctorProfileDialog({
  doctor, open, onOpenChange, onBook,
}: {
  doctor: Doctor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBook: () => void;
}) {
  const bio = doctor.bio || `Dr. ${doctor.name} is an experienced ${doctor.specialization} specialist committed to providing exceptional patient care and optimal outcomes.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[420px] rounded-[20px] border-slate-100 p-0 overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/12 to-primary/4 px-6 pt-6 pb-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary/10 mx-auto mb-3 border border-slate-100">
            <span className="text-[28px] font-black text-primary">{doctor.name.charAt(0)}</span>
          </div>
          <DialogTitle className="text-[20px] font-black text-slate-900">Dr. {doctor.name}</DialogTitle>
          <DialogDescription className="text-[13px] font-bold text-primary mt-0.5">{doctor.specialization}</DialogDescription>
        </div>

        {/* Content */}
        <div className="px-6 py-5 bg-white space-y-4">
          {/* Stats row */}
          <div className="flex items-center gap-3">
            {doctor.experience_years && (
              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[16px] font-black text-slate-900">{doctor.experience_years}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Years Exp</p>
              </div>
            )}
            <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <span className="text-[16px] font-black text-slate-900">1</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Specialty</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[16px] font-black text-slate-900">MD</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Degree</p>
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">About Doctor</h4>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{bio}</p>
          </div>

          {/* CTA */}
          <button
            onClick={onBook}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 rounded-xl text-[14px] transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            Book with Dr. {doctor.name}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
