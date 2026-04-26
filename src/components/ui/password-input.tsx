import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import zxcvbn from 'zxcvbn';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showStrengthMeter?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, showStrengthMeter = false, value = '', onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    // Evaluate password strength if enabled and there's a value
    const result = showStrengthMeter && typeof value === 'string' && value.length > 0 
      ? zxcvbn(value) 
      : null;

    // Check if password meets strict validation rules (3 out of 4 types required)
    const meetsStrictRules = (password: string): boolean => {
      if (password.length < 8) return false;
      
      // Require at least 3 out of 4 character types
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password);
      
      const typesCount = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
      return typesCount >= 3;
    };

    // Map zxcvbn score to strength levels with strict criteria
    const getStrengthLevel = () => {
      if (!result || typeof value !== 'string') return null;
      
      const passesStrictRules = meetsStrictRules(value);
      
      // Show "Strong" only if zxcvbn score >= 3 AND all strict rules are met
      if (result.score >= 3 && passesStrictRules) return 'Strong';
      
      // Show "Medium" for score 2 or if password is making progress
      if (result.score >= 2) return 'Medium';
      
      // Everything else is "Weak"
      return 'Weak';
    };

    const getStrengthColor = () => {
      if (!result) return 'bg-slate-200 dark:bg-slate-700';
      
      const strengthLevel = getStrengthLevel();
      if (strengthLevel === 'Weak') return 'bg-red-500';
      if (strengthLevel === 'Medium') return 'bg-amber-500';
      return 'bg-green-500';
    };

    // Calculate how many bars to fill based on actual strength
    const getFilledBars = () => {
      if (!result) return 0;
      
      const strengthLevel = getStrengthLevel();
      if (strengthLevel === 'Weak') return 1;
      if (strengthLevel === 'Medium') return 2;
      return 4; // Strong gets all 4 bars
    };

    const strengthLevel = getStrengthLevel();
    const filledBars = getFilledBars();

    return (
      <div className="w-full flex flex-col gap-1.5 relative">
        <div className="relative">
          <input
            {...props}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'flex h-12 w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 text-[14px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-slate-800 dark:text-slate-100',
              error ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary',
              className,
              'pr-10' // Space for the eye icon
            )}
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder={props.placeholder || 'Enter your password'}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Strength Meter */}
        {showStrengthMeter && typeof value === 'string' && value.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
            <div className="flex gap-1 h-1.5 w-full">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    'h-full flex-1 rounded-full transition-all duration-300',
                    index < filledBars ? getStrengthColor() : 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className={cn(
                'transition-colors',
                strengthLevel === 'Weak' ? 'text-red-500' :
                strengthLevel === 'Medium' ? 'text-amber-500' :
                strengthLevel === 'Strong' ? 'text-green-500' : 'text-slate-400'
              )}>
                {strengthLevel === 'Weak' ? 'Weak' :
                 strengthLevel === 'Medium' ? 'Medium' :
                 strengthLevel === 'Strong' ? 'Strong' : ''}
              </span>
              {result?.feedback?.warning && (
                <span className="text-red-500/80">{result.feedback.warning}</span>
              )}
            </div>
          </div>
        )}

        {/* Error message below the field and strength meter */}
        {error && <span className="text-[12px] font-bold text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// Custom validator for strict password rules (3 out of 4 types required)
export const validatePasswordStrength = (value: string | undefined) => {
  if (!value) return false;
  
  // Strict rule: Min 8 chars, at least 3 out of 4 character types required
  if (value.length < 8) return false;
  
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(value);
  
  const typesCount = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  if (typesCount < 3) return false;
  
  // Zxcvbn check for common/breached passwords
  const result = zxcvbn(value);
  // Accept score >= 1 to avoid overly strict validation
  return result.score >= 1;
};

export const getPasswordErrorMessage = () => {
  return "Password must be at least 8 chars, with at least 3 of: uppercase, lowercase, number, special character, and not easily guessable.";
};
