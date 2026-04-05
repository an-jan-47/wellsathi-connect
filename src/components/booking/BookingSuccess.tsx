import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { format, parseISO } from 'date-fns';

interface Props {
  clinicName: string;
  doctorName?: string;
  date: string;
  time: string;
  totalFee: number;
  bookingRefId: string;
}

export function BookingSuccess({ clinicName, doctorName, date, time, totalFee, bookingRefId }: Props) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-[28px] font-black text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 font-medium mb-6">Your appointment has been successfully booked.</p>
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Reference</span><span className="font-black text-primary tracking-wider">{bookingRefId}</span></div>
            <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Clinic</span><span className="font-bold text-slate-700">{clinicName}</span></div>
            {doctorName && <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Doctor</span><span className="font-bold text-slate-700">{doctorName}</span></div>}
            <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Date & Time</span><span className="font-bold text-slate-700">{format(parseISO(date), 'MMM d')} • {time.slice(0, 5)}</span></div>
            <div className="flex justify-between text-[14px]"><span className="text-slate-400 font-bold uppercase tracking-wider">Total</span><span className="font-black text-primary text-[16px]">₹{totalFee}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard/user')} className="flex-1 border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">My Appointments</button>
            <button onClick={() => navigate('/')} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md">Home</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
