import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import type { Doctor } from '@/types';

interface Props {
  doctors: Doctor[];
  onSelectDoctor: (doctorId: string) => void;
}

export function ClinicDoctorsGrid({ doctors, onSelectDoctor }: Props) {
  if (doctors.length === 0) return null;

  return (
    <div id="doctors" className="space-y-6">
      <h2 className="text-[26px] font-black text-slate-900 flex items-center gap-3">
        Our Doctors <span className="bg-slate-100 text-slate-500 text-[12px] px-3 py-1 rounded-full">{doctors.length}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white border border-slate-200 rounded-[24px] p-5 flex flex-col hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-[32px] font-black text-white">{doctor.name.charAt(0)}</span>
              </div>
              <div>
                <h4 className="font-black text-[18px] text-slate-900 group-hover:text-primary transition-colors">{doctor.name}</h4>
                <p className="text-[14px] font-bold text-slate-500">{doctor.specialization}</p>
                {doctor.experience_years && (
                  <p className="text-[12px] font-bold text-primary uppercase tracking-widest mt-1">
                    {doctor.experience_years} YRS EXP
                  </p>
                )}
              </div>
            </div>
            <div className="mt-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-[13px] border border-slate-200 transition-colors">
                    Full Profile
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[24px] border-slate-100 p-0 overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-lg shadow-primary/50/20 mb-4">
                      <span className="text-[36px] font-black text-primary">{doctor.name.charAt(0)}</span>
                    </div>
                    <DialogTitle className="text-[24px] font-black text-slate-900">{doctor.name}</DialogTitle>
                    <DialogDescription className="text-[15px] font-bold text-slate-500 mt-1">{doctor.specialization}</DialogDescription>
                  </div>
                  <div className="p-6 bg-white space-y-4">
                    {doctor.experience_years && (
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                        <span className="text-[15px] font-extrabold text-slate-900">{doctor.experience_years} Years</span>
                      </div>
                    )}
                    <div className="py-2">
                      <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">About Doctor</span>
                      <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                        Dr. {doctor.name} is a highly experienced {doctor.specialization} specialist committed to providing exceptional care.
                        They have dedicated their career to advancing medical treatments and ensuring optimal patient outcomes.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onSelectDoctor(doctor.id);
                        document.querySelector('[data-state="open"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl text-[14px] transition-colors shadow-md mt-4"
                    >
                      Book Appointment with Dr. {doctor.name}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
