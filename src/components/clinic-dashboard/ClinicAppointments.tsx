import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateAppointmentStatus } from '@/services/appointmentService';
import { toast } from 'sonner';
import { User, Phone, Clock, Calendar, CheckCircle2, XCircle, FileText, Loader2, CalendarX, Stethoscope, Activity, RefreshCw, Search } from 'lucide-react';
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
  clinicId: string;
  appointments: Appointment[];
  onUpdate: () => void;
  onViewSchedule?: () => void;
  date?: string;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'cancelled';

export function ClinicAppointments({ 
  clinicId,
  appointments, 
  onUpdate, 
  onViewSchedule, 
  date,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesFilter = filter === 'all' || apt.status === filter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        apt.patient_name.toLowerCase().includes(searchLower) ||
        (apt.patient_phone && apt.patient_phone.includes(searchLower));
      return matchesFilter && matchesSearch;
    });
  }, [appointments, filter, searchQuery]);

  const counts = useMemo(() => ({
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments]);

  const displayDate = date ? format(new Date(date), "EEEE, MMMM do") : 'the selected date';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Appointments Grid */}
      {appointments.length === 0 ? (
        <div className="p-10 md:p-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 rounded-[24px] min-h-[400px] border border-slate-100 dark:border-slate-800">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center shadow-inner">
              <CalendarX className="w-10 h-10 text-primary dark:text-primary" strokeWidth={2} />
            </div>
          </div>
          <h4 className="text-[22px] font-black text-slate-800 dark:text-white mb-2 tracking-tight">No Appointments</h4>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 text-[15px] font-medium">
            Your schedule for {displayDate} is clear. You can manually add new patients or manage your staff availability.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <Button 
              className="px-6 py-5 font-bold text-[14px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
              onClick={() => navigate(`/book/${clinicId}`)}
            >
              Add Appointment
            </Button>
            {onViewSchedule && (
              <Button 
                variant="outline"
                className="px-6 py-5 font-bold text-[14px] rounded-xl border-slate-200 hover:bg-slate-100 transition-all shadow-none"
                onClick={onViewSchedule}
              >
                View Staff Schedule
              </Button>
            )}
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
          <p className="text-slate-500 font-medium">No appointments match your current filters.</p>
          <Button variant="link" onClick={() => { setFilter('all'); setSearchQuery(''); }} className="text-primary font-bold mt-2">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => (
            <Card 
              key={apt.id} 
              className="group overflow-hidden border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all rounded-2xl cursor-pointer bg-white dark:bg-slate-800"
              onClick={() => setSelectedAppt(apt)}
            >
              <div className="flex flex-col h-full">
                {/* Header Section */}
                <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-[15px]">
                      {apt.time.slice(0, 5)}
                    </span>
                  </div>
                  <Badge
                    variant={
                      apt.status === 'confirmed' ? 'confirmed' :
                      apt.status === 'cancelled' ? 'cancelled' : 'pending'
                    }
                    className="px-3 py-1 rounded-lg font-bold shadow-sm"
                  >
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </Badge>
                </div>

                {/* Body Section */}
                <CardContent className="p-4 sm:p-5 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-black text-[17px] text-slate-900 dark:text-white truncate">
                        {apt.patient_name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="truncate">{apt.patient_phone}</span>
                      </div>
                    </div>
                  </div>

                  {(apt.doctors || apt.notes) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                      {apt.doctors && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold">{apt.doctors.name}</span>
                        </div>
                      )}
                      {apt.notes && (
                        <div className="flex items-start gap-2 text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Footer / Actions */}
                <div className="p-4 sm:p-5 border-t border-slate-50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20 flex flex-wrap items-center justify-end gap-2 mt-auto">
                  {apt.status === 'pending' && (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10 rounded-xl px-4 font-bold"
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
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 font-bold shadow-md shadow-emerald-500/20 border-none"
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
                    </>
                  )}

                  {(apt.status === 'pending' || apt.status === 'confirmed') && apt.doctor_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary border-primary/20 hover:bg-primary/10 rounded-xl px-4 font-bold ml-auto sm:ml-0"
                      disabled={updatingId === apt.id}
                      onClick={(e) => { e.stopPropagation(); setRescheduleAppt(apt); }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      Reschedule
                    </Button>
                  )}

                  {apt.status === 'confirmed' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-500 border-slate-200 hover:bg-slate-100 rounded-xl px-4 font-bold"
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
            </Card>
          ))}
        </div>
      )}

      {/* Load More for Infinite Scroll */}
      {hasNextPage && fetchNextPage && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            className="px-8 py-5 rounded-xl font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More Appointments'
            )}
          </Button>
        </div>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-slate-100 dark:border-slate-700 p-0 overflow-hidden shadow-2xl bg-white dark:bg-slate-800 focus:outline-none">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <DialogTitle className="text-[19px] font-black tracking-tight text-slate-800 dark:text-white">
              Appointment Details
            </DialogTitle>
          </div>
          
          {selectedAppt && (
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner flex-shrink-0">
                  <User className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-[18px] tracking-tight truncate">{selectedAppt.patient_name}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                      <Phone className="h-3 w-3 text-slate-500 dark:text-slate-400" strokeWidth={3} />
                    </div>
                    <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300 truncate">
                      {selectedAppt.patient_phone}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedAppt.status === 'confirmed' ? 'confirmed' :
                    selectedAppt.status === 'cancelled' ? 'cancelled' : 'pending'
                  }
                  className="px-3 py-1.5 rounded-xl font-extrabold uppercase text-[11px] tracking-wider ml-2"
                >
                  {selectedAppt.status}
                </Badge>
              </div>

              <hr className="border-slate-100 dark:border-slate-700" />

              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                    <Calendar className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">Date</span>
                  </div>
                  <p className="font-black text-slate-800 dark:text-white text-[15px]">{format(new Date(selectedAppt.date), 'MMM d, yyyy')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                    <Clock className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">Time</span>
                  </div>
                  <p className="font-black text-slate-800 dark:text-white text-[15px]">{selectedAppt.time.slice(0, 5)}</p>
                </div>
              </div>

              {/* Doctor & Services */}
              {(selectedAppt.doctors || (selectedAppt.booking_services && selectedAppt.booking_services.length > 0)) && (
                <div className="space-y-4">
                  {selectedAppt.doctors && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Stethoscope className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Doctor Selected</p>
                        <p className="text-[15px] font-black text-slate-800 dark:text-white">{selectedAppt.doctors.name}</p>
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{selectedAppt.doctors.specialization}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedAppt.booking_services && selectedAppt.booking_services.length > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Activity className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Services Opted</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAppt.booking_services.map((svc, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-[13px] font-bold text-slate-700 dark:text-slate-200">
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
               <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/50 p-5 rounded-2xl">
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
