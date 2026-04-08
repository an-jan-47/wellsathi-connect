import { useState, useMemo, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAllSlots } from '@/hooks/queries/useSlots';
import { useRescheduleAppointment } from '@/hooks/queries/useAppointments';
import { format, addDays, parseISO, isToday as isTodayFn } from 'date-fns';
import { Calendar, Clock, Loader2, ArrowRight, CalendarClock, RefreshCw } from 'lucide-react';
import type { Appointment } from '@/types';
import type { AppointmentWithClinic } from '@/services/appointmentService';

interface RescheduleDialogProps {
  /** The appointment to reschedule */
  appointment: Appointment | AppointmentWithClinic;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog closes */
  onOpenChange: (open: boolean) => void;
  /** Called after a successful reschedule */
  onSuccess?: () => void;
}

/**
 * Full-featured reschedule dialog that lets the user pick a new date + time slot
 * for the same doctor. Reuses the same slot-selection UI as Book.tsx.
 */
export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const doctorId = appointment.doctor_id ?? '';
  const doctorName = appointment.doctors?.name ?? 'Doctor';

  // Date state — default to today
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedTime, setSelectedTime] = useState('');

  const { data: slots = [], isLoading: slotsLoading } = useAllSlots(
    doctorId || undefined,
    selectedDate
  );
  const rescheduleMutation = useRescheduleAppointment();

  // Generate 7 days of date options
  const dateOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
          value: format(date, 'yyyy-MM-dd'),
          dayName: format(date, 'EEE'),
          dayNum: format(date, 'd'),
          month: format(date, 'MMM'),
          isToday: i === 0,
        };
      }),
    []
  );

  // Filter out past time slots for today
  const filteredSlots = useMemo(() => {
    const isToday = isTodayFn(parseISO(selectedDate));
    if (!isToday) return slots;
    const nowStr = format(new Date(), 'HH:mm:ss');
    return slots.filter((slot) => slot.start_time > nowStr);
  }, [slots, selectedDate]);

  // Reset time when date changes
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedTime || !doctorId) return;

    rescheduleMutation.mutate(
      {
        appointmentId: appointment.id,
        newDoctorId: doctorId,
        newDate: selectedDate,
        newTime: selectedTime,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedTime('');
          onSuccess?.();
        },
      }
    );
  }, [
    selectedTime,
    doctorId,
    appointment.id,
    selectedDate,
    rescheduleMutation,
    onOpenChange,
    onSuccess,
  ]);

  // Prevent rescheduling to the same slot
  const isSameSlot =
    selectedDate === appointment.date && selectedTime === appointment.time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[500px] rounded-[20px] sm:rounded-[24px] border-slate-100 p-0 overflow-hidden shadow-2xl bg-white focus:outline-none max-h-[85vh] flex flex-col">
        {/* Header — compact */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 sm:px-6 py-4 border-b border-slate-100/60 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-[17px] sm:text-[19px] font-black tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary shrink-0" />
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>
          <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 mt-1">
            Pick a new date and time for{' '}
            <span className="font-bold text-slate-700">Dr. {doctorName}</span>
          </p>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Current Appointment Info — compact */}
          <div className="flex items-center gap-3 p-3 bg-amber-50/80 rounded-xl border border-amber-100/80">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-amber-500 uppercase tracking-widest leading-none mb-1">
                Current Slot
              </p>
              <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 leading-tight">
                {format(parseISO(appointment.date), 'EEE, d MMM yyyy')} •{' '}
                {appointment.time.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
              Select New Date
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleDateChange(opt.value)}
                    className={`flex flex-col items-center justify-center shrink-0 w-[58px] sm:w-[64px] h-[68px] sm:h-[74px] rounded-[14px] sm:rounded-[16px] transition-all border-2 ${
                      isSelected
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                        : 'border-slate-100 bg-slate-50/80 text-slate-500 hover:border-primary/30 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold uppercase ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {opt.dayName}
                    </span>
                    <span className="text-[18px] sm:text-[20px] font-black leading-tight">
                      {opt.dayNum}
                    </span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold uppercase ${
                        isSelected ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      {opt.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
              Available Slots
            </p>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[180px] sm:max-h-[200px] overflow-y-auto pr-0.5">
                {filteredSlots.map((slot) => {
                  const isSelected = selectedTime === slot.start_time;
                  const isCurrentSlot =
                    selectedDate === appointment.date &&
                    slot.start_time === appointment.time;

                  return (
                    <button
                      key={slot.start_time}
                      disabled={!slot.is_available || isCurrentSlot}
                      onClick={() => {
                        if (slot.is_available && !isCurrentSlot)
                          setSelectedTime(slot.start_time);
                      }}
                      className={`py-2 rounded-lg text-[12px] sm:text-[13px] font-bold border-2 transition-all ${
                        isCurrentSlot
                          ? 'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed'
                          : !slot.is_available
                          ? 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                          : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                      title={
                        isCurrentSlot ? 'Current appointment slot' : undefined
                      }
                    >
                      {slot.start_time.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl py-6 text-center border border-slate-100">
                <Clock className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-[12px] text-slate-400 font-bold">
                  No slots available for this date
                </p>
              </div>
            )}
          </div>

          {/* Selected New Slot Preview */}
          {selectedTime && !isSameSlot && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15 animate-fade-in">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold text-primary/60 uppercase tracking-widest leading-none mb-1">
                  New Slot
                </p>
                <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 leading-tight">
                  {format(parseISO(selectedDate), 'EEE, d MMM yyyy')} •{' '}
                  {selectedTime.slice(0, 5)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer actions — never scrolls, never gets cut off */}
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 bg-white flex gap-2.5 sm:gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 sm:py-3 rounded-xl hover:bg-slate-50 transition-colors text-[13px] sm:text-[14px]"
          >
            Cancel
          </button>
          <button
            disabled={
              !selectedTime || isSameSlot || rescheduleMutation.isPending
            }
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[13px] sm:text-[14px] py-2.5 sm:py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
          >
            {rescheduleMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Confirm Reschedule
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
