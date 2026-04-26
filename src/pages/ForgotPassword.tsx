import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const emailSchema = z.object({
  email: z.string().min(1, 'Please enter your email address').regex(emailRegex, 'Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof emailSchema>;

export default function ForgotPassword() {
  const { resetPassword } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    const { error } = await resetPassword(data.email);
    if (error) {
      toast.error(error.message);
    } else {
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background dark:bg-background">
          <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 p-8 sm:p-10 animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
              We've sent a password reset link to <strong className="text-slate-800 dark:text-slate-200">{submittedEmail}</strong>. 
              Click the link in the email to set a new password.
            </p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 mb-8 font-medium">
              Don't see the email? Check your spam folder.
            </p>
            <Link 
              to="/auth"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background dark:bg-background font-sans text-slate-800 dark:text-slate-200">
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 p-8 sm:p-10 animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-5 group cursor-pointer">
              <img src="/favicon.ico" alt="WellSathi Logo" className="w-10 h-10 group-hover:scale-105 transition-transform duration-300 rounded-xl" />
            </Link>
            <h1 className="text-[24px] font-black tracking-tight text-slate-900 dark:text-white">
              Reset Password
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-1 text-center">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[14px] font-medium outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 dark:hover:border-slate-600'}`}
              />
              {errors.email && <p className="text-[12px] font-bold text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
