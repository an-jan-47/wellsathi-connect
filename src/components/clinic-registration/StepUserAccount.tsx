import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { userAccountSchema, type UserAccountData } from '@/types/clinic-registration';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

interface Props { data: Partial<UserAccountData>; onNext: (data: UserAccountData) => void; }

/* ── Shared premium input wrapper ── */
function Field({ label, icon: Icon, error, children }: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-extrabold text-slate-700 mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        {children}
      </div>
      {error && <p className="text-[12px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}

export function StepUserAccount({ data, onNext }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserAccountData>({
    resolver: zodResolver(userAccountSchema),
    defaultValues: { ownerName: data.ownerName || '', email: data.email || '', phone: data.phone || '', password: data.password || '', confirmPassword: '' },
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(`${window.location.origin}/register-clinic`);
    if (error) {
      toast({ title: 'Error', description: 'Could not authenticate with Google.', variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl text-[14px] font-medium outline-none transition-colors ${hasError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-primary'}`;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-[26px] font-black text-slate-900">Create Your Account</h2>
        <p className="text-slate-400 font-medium mt-1 text-[14px]">Start by setting up your clinic owner account.</p>
      </div>

      <Field label="Full Name" icon={User} error={errors.ownerName?.message}>
        <input id="ownerName" placeholder="Dr. John Smith" className={inputCls(!!errors.ownerName)} {...register('ownerName')} />
      </Field>

      <Field label="Email Address" icon={Mail} error={errors.email?.message}>
        <input id="email" type="email" placeholder="doctor@clinic.com" className={inputCls(!!errors.email)} {...register('email')} />
      </Field>

      <Field label="Phone Number" icon={Phone} error={errors.phone?.message}>
        <input id="phone" type="tel" placeholder="+91 9876543210" className={inputCls(!!errors.phone)} {...register('phone')} />
      </Field>

      <Field label="Password" icon={Lock} error={errors.password?.message}>
        <input id="password" type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters"
          className={`${inputCls(!!errors.password)} pr-11`} {...register('password')} />
        <button type="button" onClick={() => setShowPw(!showPw)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword?.message}>
        <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
          className={`${inputCls(!!errors.confirmPassword)} pr-11`} {...register('confirmPassword')} />
        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      <button type="submit" disabled={isSubmitting || googleLoading}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 text-[15px] flex items-center justify-center gap-2">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Continue →
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Or continue with</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting || googleLoading}
        className="w-full border-2 border-slate-100 hover:border-primary/30 bg-slate-50 hover:bg-white text-slate-700 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 text-[14px]">
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>
    </form>
  );
}
