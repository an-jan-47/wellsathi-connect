import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateAppointmentStatus } from '@/services/appointmentService';
import { toast } from 'sonner';
import { User, Phone, Clock, Calendar, CheckCircle2, XCircle, FileText, Loader2, CalendarX, Stethoscope, Activity, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import type { Appointment } from '@/types';

interface Props {
  appointments: Appointment[];
  onUpdate: () => void;
  onViewSchedule?: () => void;
  date?: string;
}

export function ClinicAppointments({ appointments, onUpdate, onViewSchedule, date }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const navigate = useNavigate();

  const handleStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, status);
      toast.success(
        status === 'confirmed'
          ? 'Appointment confirmed'
          : 'Appointment rejected — slot is now available'
      );
      onUpdate();
    } catch {
      toast.error('Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (appointments.length === 0) {
    const displayDate = date ? format(new Date(date), "EEEE, MMMM do") : 'the selected date';
    return (
      <div className="p-10 md:p-20 flex flex-col items-center justify-center text-center bg-[#f8fbfa] rounded-[24px] min-h-[450px]">
        <div className="relative mb-8">
          <div className="w-[120px] h-[120px] bg-[#edf6f5]/80 rounded-full flex items-center justify-center shadow-inner">
            <CalendarX className="w-12 h-12 text-[#94a3b8]" strokeWidth={2} />
          </div>
        </div>
        <h4 className="text-[22px] font-black text-slate-800 mb-3 tracking-tight">No appointments for this date</h4>
        <p className="text-slate-500 max-w-sm mx-auto mb-10 text-[14px] leading-relaxed font-medium">
          It looks like the schedule for {displayDate} is clear. You can start booking new patients or manage your staff availability.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
          <Button 
            className="px-6 py-6 sm:px-8 font-bold text-[14px] rounded-xl bg-[#006b5f] hover:bg-[#005048] text-white shadow-[0_8px_20px_-5px_rgba(0,107,95,0.4)] transition-all"
            onClick={() => navigate('/book')}
          >
            Add Appointment
          </Button>
          {onViewSchedule && (
            <Button 
              className="px-6 py-6 sm:px-8 font-bold text-[14px] rounded-xl bg-[#e2e8f0]/70 text-[#334155] hover:bg-[#cbd5e1] border-none transition-all shadow-none"
              onClick={onViewSchedule}
            >
              View Staff Schedule
            </Button>
          )}
        </div>
      </div>
    );
  }

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const renderGroup = (title: string, items: Appointment[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4">
        <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest pl-2">
          {title} ({items.length})
        </h3>
        <div className="grid gap-4">
          {items.map((apt) => (
            <Card 
              key={apt.id} 
              className="border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-primary/20 transition-all rounded-2xl cursor-pointer"
              onClick={() => setSelectedAppt(apt)}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block leading-tight">{apt.patient_name}</span>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {apt.patient_phone}
                          </span>
                          <span className="flex items-center gap-1.5 text-primary font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            {apt.time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {apt.notes && (
                      <div className="flex items-start gap-2 text-[13px] text-slate-600 bg-slate-50 p-3 rounded-xl ml-[52px]">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                        <span className="leading-relaxed font-medium">{apt.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-none border-slate-100 mt-2 md:mt-0">
                    <Badge
                      variant={
                        apt.status === 'confirmed' ? 'confirmed' :
                        apt.status === 'cancelled' ? 'cancelled' : 'pending'
                      }
                      className="px-3 py-1.5 rounded-lg font-bold"
                    >
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </Badge>

                    {/* Pending → Accept or Reject */}
                    {apt.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10 rounded-xl px-4 font-bold"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(apt.id, 'confirmed'); }}
                          disabled={updatingId === apt.id}
                        >
                          {updatingId === apt.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          )}
                          Accept
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl px-4 font-bold"
                              disabled={updatingId === apt.id}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-extrabold text-slate-900">Decline this appointment?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                This will reject the appointment and make the time slot available for other patients immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Keep</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                              >
                                Yes, Decline
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {/* Reschedule — for pending and confirmed */}
                    {(apt.status === 'pending' || apt.status === 'confirmed') && apt.doctor_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 hover:bg-primary/5 rounded-xl px-4 font-bold"
                        disabled={updatingId === apt.id}
                        onClick={(e) => { e.stopPropagation(); setRescheduleAppt(apt); }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Reschedule
                      </Button>
                    )}

                    {/* Confirmed → Cancel option */}
                    {apt.status === 'confirmed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-500 border-slate-200 hover:bg-slate-50 rounded-xl px-4 font-bold"
                            disabled={updatingId === apt.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Cancel Appt
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-extrabold text-slate-900">Cancel confirmed appointment?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                              The patient will be notified and the slot will become available again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">Nevermind</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                            >
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {renderGroup('Pending Approvals', pending)}
      {renderGroup('Confirmed Patients', confirmed)}
      {renderGroup('Cancelled / Past', cancelled)}

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-slate-100 p-0 overflow-hidden shadow-2xl bg-white focus:outline-none">
          <div className="bg-[#f8f9ff] px-6 py-5 border-b border-slate-100/60">
            <DialogTitle className="text-[19px] font-black tracking-tight text-slate-800">
              Appointment Details
            </DialogTitle>
          </div>
          
          {selectedAppt && (
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                  <User className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-[18px] tracking-tight truncate">{selectedAppt.patient_name}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="p-1 bg-slate-100 rounded-md">
                      <Phone className="h-3 w-3 text-slate-500" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-600 truncate">
                      {selectedAppt.patient_phone}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedAppt.status === 'confirmed' ? 'confirmed' :
                    selectedAppt.status === 'cancelled' ? 'cancelled' : 'pending'
                  }
                  className="px-3.5 py-1.5 rounded-xl font-extrabold uppercase text-[11px] tracking-wider ml-2"
                >
                  {selectedAppt.status}
                </Badge>
              </div>

              <hr className="border-slate-100" />

              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 hover:bg-slate-100/50 transition-colors p-4 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Calendar className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">Date</span>
                  </div>
                  <p className="font-black text-slate-800 text-[15px]">{format(new Date(selectedAppt.date), 'MMM d, yyyy')}</p>
                </div>
                <div className="bg-slate-50 hover:bg-slate-100/50 transition-colors p-4 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Clock className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">Time</span>
                  </div>
                  <p className="font-black text-slate-800 text-[15px]">{selectedAppt.time.slice(0, 5)}</p>
                </div>
              </div>

              {/* Doctor & Services */}
              {(selectedAppt.doctors || (selectedAppt.booking_services && selectedAppt.booking_services.length > 0)) && (
                <div className="space-y-4">
                  {selectedAppt.doctors && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
                      <div className="p-2.5 bg-[#f0f9ff] text-[#0284c7] rounded-xl">
                        <Stethoscope className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Doctor Selected</p>
                        <p className="text-[15px] font-black text-slate-800">{selectedAppt.doctors.name}</p>
                        <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{selectedAppt.doctors.specialization}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedAppt.booking_services && selectedAppt.booking_services.length > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
                      <div className="p-2.5 bg-[#f5f3ff] text-[#7c3aed] rounded-xl">
                        <Activity className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Services Opted</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAppt.booking_services.map((svc, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[13px] font-bold text-slate-700">
                              {svc.clinic_services?.service_name || 'Service'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedAppt.notes && (
                <div className="bg-amber-50 text-amber-900 border border-amber-100 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
                    <span className="font-extrabold text-[13px] tracking-tight">Patient Notes</span>
                  </div>
                  <p className="leading-relaxed font-semibold opacity-90 text-[14px]">{selectedAppt.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      {rescheduleAppt && (
        <RescheduleDialog
          appointment={rescheduleAppt}
          open={!!rescheduleAppt}
          onOpenChange={(open) => { if (!open) setRescheduleAppt(null); }}
          onSuccess={() => { setRescheduleAppt(null); onUpdate(); }}
        />
      )}
    </div>
  );
}
