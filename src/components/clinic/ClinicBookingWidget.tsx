import { Calendar, ChevronDown, Star, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Doctor, Clinic } from '@/types';
import type { TimeSlot } from '@/types';
import { ClinicMap } from './ClinicMap';

interface DateOption {
  value: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}

interface Props {
  clinic: Clinic;
  doctors: Doctor[];
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlot: string;
  dateOptions: DateOption[];
  filteredSlots: TimeSlot[];
  onDoctorChange: (doctorId: string) => void;
  onDateChange: (date: string) => void;
  onSlotChange: (time: string) => void;
  onBooking: () => void;
}

export function ClinicBookingWidget({
  clinic, doctors, selectedDoctorId, selectedDate, selectedSlot,
  dateOptions, filteredSlots,
  onDoctorChange, onDateChange, onSlotChange, onBooking,
}: Props) {
  return (
    <div className="w-full lg:w-[420px] shrink-0 space-y-6">
      <div className="sticky top-24">

        {/* Map Location Card */}
        <div className="bg-white rounded-[24px] border border-slate-200 p-2 mb-6 hidden lg:block">
          <div className="aspect-[21/9] bg-slate-100 rounded-[16px] overflow-hidden relative mb-2">
            <ClinicMap clinics={[clinic]} />
          </div>
          <div className="px-4 pb-3 pt-2">
            <h4 className="font-black text-slate-900 text-[15px] mb-1">Clinic Location</h4>
            <p className="text-[13px] text-slate-500 font-medium mb-3">{clinic.address}</p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}, ${clinic.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 font-bold text-[13px] py-2.5 rounded-xl transition-colors"
            >
              Get Directions
            </a>
          </div>
        </div>

        {/* Booking Engine */}
        <div className="bg-white rounded-[32px] border border-slate-100/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-7">
            <h3 className="text-[22px] font-black text-slate-900 mb-1">Book an Appointment</h3>
            <p className="text-[14px] text-slate-500 font-medium mb-8">Select your preferred date and time.</p>

            {/* Doctor Selector */}
            <div className="mb-8">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Specialist</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-primary transition-colors rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 outline-none cursor-pointer">
                    <span>
                      {doctors.length === 0 ? 'No doctors available' :
                        (doctors.find(d => d.id === selectedDoctorId)
                          ? `Dr. ${doctors.find(d => d.id === selectedDoctorId)?.name} (${doctors.find(d => d.id === selectedDoctorId)?.specialization})`
                          : 'Select a Specialist')}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[320px] sm:w-[360px] rounded-2xl shadow-xl border-slate-100 p-2 max-h-[300px] overflow-y-auto" align="start">
                  {doctors.length === 0 && <div className="p-4 text-center text-sm font-medium text-slate-500">No doctors available</div>}
                  {doctors.map(d => (
                    <DropdownMenuItem
                      key={d.id}
                      onClick={() => {
                        onDoctorChange(d.id);
                        onSlotChange('');
                      }}
                      className={`font-bold py-3 px-4 cursor-pointer rounded-xl mb-1 ${selectedDoctorId === d.id ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}
                    >
                      Dr. {d.name} <span className="text-slate-400 ml-1 font-medium">({d.specialization})</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Bubbles */}
            <div className="mb-8">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Date</label>
              <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 -mx-2 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
                {dateOptions.map(option => {
                  const isSelected = selectedDate === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onDateChange(option.value);
                        onSlotChange('');
                      }}
                      className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[88px] rounded-[20px] transition-all border ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/50/30 scale-105'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className={`text-[12px] font-bold uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {option.dayName}
                      </span>
                      <span className="text-[22px] font-black leading-none">{option.dayNum}</span>
                      <span className={`text-[11px] font-black uppercase mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {option.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Available Times</label>
              </div>
              {filteredSlots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 pb-2">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.start_time;
                    return (
                      <button
                        key={slot.id}
                        disabled={!slot.is_available}
                        onClick={() => onSlotChange(slot.start_time)}
                        className={`py-3.5 rounded-xl text-[14px] font-bold border transition-all ${
                          !slot.is_available
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed hidden'
                            : isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {slot.start_time.slice(0, 5)} {parseInt(slot.start_time) >= 12 ? 'PM' : 'AM'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl py-8 text-center border border-slate-100 flex flex-col items-center">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-[14px] font-bold text-slate-500">No time slots available</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={onBooking}
                className={`w-full py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 ${
                  selectedSlot
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/50/25 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!selectedSlot}
              >
                {selectedSlot ? 'Confirm Appointment' : 'Select a Time Slot'}
              </button>
            </div>

          </div>
          {/* Bottom strip */}
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <span className="text-[12px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" /> Top-rated doctors on WellSathi
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
