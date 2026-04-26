import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2, Building2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkRateLimit, getRateLimitCooldown, RATE_LIMITS } from '@/lib/rateLimit';
import { PhoneInput, validatePhoneNumber } from '@/components/ui/phone-input';
import { PasswordInput, validatePasswordStrength, getPasswordErrorMessage } from '@/components/ui/password-input';

// Strict email RFC compliant regex
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const signInSchema = z.object({
  email: z.string().min(1, 'Please enter your email address').regex(emailRegex, 'Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().min(1, 'Please enter your email address').regex(emailRegex, 'Please enter a valid email address').max(255),
  phone: z.string().optional().refine(validatePhoneNumber, 'Invalid phone number for selected country'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(validatePasswordStrength, getPasswordErrorMessage()),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles, isLoading, isInitialized } = useAuthStore();
  const { signIn, signUp, signInWithGoogle } = useAuthStore();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );

  useDocumentTitle(mode === 'signup' ? 'Create Account' : 'Sign In');

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (user && isInitialized && !isLoading) {
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        navigate(redirectTo);
      } else if (roles.includes('clinic')) {
        navigate('/dashboard/clinic');
      } else if (roles.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, roles, isInitialized, isLoading, navigate, searchParams]);

  const onSignInSubmit = async (data: SignInValues) => {
    if (!checkRateLimit('auth_attempt', RATE_LIMITS.AUTH)) {
      const cooldown = getRateLimitCooldown('auth_attempt', RATE_LIMITS.AUTH);
      toast.error(`Too many attempts. Please wait ${cooldown}s before trying again.`);
      return;
    }

    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
  };

  const onSignUpSubmit = async (data: SignUpValues) => {
    if (!checkRateLimit('auth_attempt', RATE_LIMITS.AUTH)) {
      const cooldown = getRateLimitCooldown('auth_attempt', RATE_LIMITS.AUTH);
      toast.error(`Too many attempts. Please wait ${cooldown}s before trying again.`);
      return;
    }

    const redirectTo = searchParams.get('redirect');
    const { error } = await signUp(data.email, data.password, data.name, data.phone || undefined, redirectTo || undefined);
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! You can now sign in.');
      setMode('signin');
      signInForm.setValue('email', data.email);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const redirectTo = searchParams.get('redirect');
    const { error } = await signInWithGoogle(redirectTo || undefined);
    
    if (error) {
      toast.error('Could not authenticate with Google.');
      setIsGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    signInForm.reset();
    signUpForm.reset();
  };

  const isSubmitting = mode === 'signin' ? signInForm.formState.isSubmitting : signUpForm.formState.isSubmitting;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-4 font-sans text-slate-800 dark:text-slate-200">
      
      <div className="w-full max-w-[1200px] flex justify-between items-center p-4 md:p-6">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
           <img src="/favicon.ico" alt="WellSathi Logo" className="w-8 h-8 group-hover:scale-105 transition-transform duration-300" />
           <span className="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-tight hidden sm:block">WellSathi</span>
        </Link>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-700 ease-out hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-shadow">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
              <img src="/favicon.ico" alt="Logo" className="w-6 h-6 object-contain opacity-80" />
            </div>
            <h1 className="text-[24px] font-black tracking-tight text-slate-900 dark:text-white">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {mode === 'signin' 
                ? 'Please enter your details to sign in.' 
                : 'Enter your details to register.'}
            </p>
          </div>

          {mode === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signin-email">Email</label>
                <input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email address"
                  {...signInForm.register('email')}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[14px] font-medium outline-none transition-all ${signInForm.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 dark:hover:border-slate-600'}`}
                />
                {signInForm.formState.errors.email && <p className="text-[12px] font-bold text-red-500 mt-1">{signInForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signin-password">Password</label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-[12px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Controller
                  name="password"
                  control={signInForm.control}
                  render={({ field, fieldState }) => (
                    <PasswordInput
                      id="signin-password"
                      placeholder="Enter your password"
                      {...field}
                      error={fieldState.error?.message}
                      showStrengthMeter={false}
                    />
                  )}
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center shadow-lg shadow-primary/20"
                disabled={isLoading || isGoogleLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-5">
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    placeholder="Enter your full name"
                    {...signUpForm.register('name')}
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[14px] font-medium outline-none transition-all ${signUpForm.formState.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  />
                  {signUpForm.formState.errors.name && <p className="text-[12px] font-bold text-red-500 mt-1">{signUpForm.formState.errors.name.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signup-phone">Phone (optional)</label>
                  <Controller
                    name="phone"
                    control={signUpForm.control}
                    render={({ field, fieldState }) => (
                      <PhoneInput
                        {...field}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email address"
                  {...signUpForm.register('email')}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[14px] font-medium outline-none transition-all ${signUpForm.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 dark:hover:border-slate-600'}`}
                />
                {signUpForm.formState.errors.email && <p className="text-[12px] font-bold text-red-500 mt-1">{signUpForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300" htmlFor="signup-password">Password</label>
                <Controller
                  name="password"
                  control={signUpForm.control}
                  render={({ field, fieldState }) => (
                    <PasswordInput
                      id="signup-password"
                      placeholder="Enter your password"
                      {...field}
                      error={fieldState.error?.message}
                      showStrengthMeter={true}
                    />
                  )}
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center shadow-lg shadow-primary/20"
                disabled={isLoading || isGoogleLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <div className="relative my-8">
             <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-slate-700"></span>
             </div>
             <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                <span className="bg-white dark:bg-slate-800 px-3">Or</span>
             </div>
          </div>

          <button 
            type="button" 
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            disabled={isLoading || isGoogleLoading || isSubmitting}
            onClick={handleGoogleSignIn}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <div className="mt-8 text-center">
            <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary font-bold hover:text-primary/80 transition-colors focus:outline-none"
              >
                {mode === 'signin' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>

          {mode === 'signup' && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <Link
                to="/register-clinic"
                className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
              >
                <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                  Are you a clinic owner? <span className="text-primary group-hover:underline">Register clinic</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1200px] flex justify-center pb-6 md:pb-8 text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest gap-8">
         <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</a>
         <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</a>
         <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Help</a>
      </div>

    </div>
  );
}
