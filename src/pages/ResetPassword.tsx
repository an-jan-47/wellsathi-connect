import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordInput, validatePasswordStrength, getPasswordErrorMessage } from '@/components/ui/password-input';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(validatePasswordStrength, getPasswordErrorMessage()),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof passwordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    // Supabase redirects back with the user session via the URL hash
    // The auth state change listener in authStore will handle setting the session
    // If there's no user after a few seconds, something went wrong
    const timeout = setTimeout(() => {
      if (!user) {
        toast.error('Invalid or expired reset link. Please try again.');
        navigate('/auth/forgot-password');
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [user, navigate]);

  const onSubmit = async (data: ResetPasswordValues) => {
    const { error } = await updatePassword(data.password);
    if (error) {
      toast.error(error.message);
    } else {
      setIsSuccess(true);
      toast.success('Password updated successfully!');
    }
  };

  if (isSuccess) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background dark:bg-background">
          <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 p-8 sm:p-10 animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Password Updated!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link 
              to="/auth"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-primary/20"
            >
              Sign In
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
              Set New Password
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="password">New Password</label>
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <PasswordInput
                    id="password"
                    placeholder="Enter your new password"
                    {...field}
                    error={fieldState.error?.message}
                    showStrengthMeter={true}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">Confirm Password</label>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm your new password"
                    {...field}
                    error={fieldState.error?.message}
                    showStrengthMeter={false}
                  />
                )}
              />
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
