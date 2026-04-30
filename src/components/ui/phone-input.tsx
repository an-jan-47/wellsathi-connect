import { forwardRef, useEffect, useRef, useState } from 'react';
import IntlTelInput from 'intl-tel-input/react';
import 'intl-tel-input/styles';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, className }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<string>('in');
    
    useEffect(() => {
      // Add dark mode and improved styles for intl-tel-input
      const style = document.createElement('style');
      style.id = 'intl-tel-input-dark-mode';
      style.textContent = `
        /* Dark mode styles for intl-tel-input dropdown */
        .dark .iti__dropdown-content {
          background-color: rgb(15 23 42) !important; /* slate-900 */
          border: 1px solid rgb(51 65 85) !important; /* slate-700 */
          max-height: 250px !important;
          overflow-y: auto !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
          border-radius: 12px !important;
          width: 320px !important; /* Reduced width */
        }
        
        /* Hide scrollbar but keep functionality */
        .iti__dropdown-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .iti__dropdown-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .iti__dropdown-content::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
          border-radius: 3px;
        }
        
        .dark .iti__dropdown-content::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
        }
        
        .dark .iti__search-input {
          background-color: rgb(30 41 59) !important; /* slate-800 */
          border: 1px solid rgb(51 65 85) !important; /* slate-700 */
          color: rgb(226 232 240) !important; /* slate-200 */
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
        
        .dark .iti__search-input::placeholder {
          color: rgb(148 163 184) !important; /* slate-400 */
        }
        
        .dark .iti__country {
          color: rgb(226 232 240) !important; /* slate-200 */
          padding: 10px 12px !important;
        }
        
        .dark .iti__country:hover {
          background-color: rgb(51 65 85) !important; /* slate-700 */
        }
        
        .dark .iti__country.iti__highlight {
          background-color: rgb(51 65 85) !important; /* slate-700 */
        }
        
        .dark .iti__dial-code {
          color: rgb(148 163 184) !important; /* slate-400 */
        }
        
        .dark .iti__country-name {
          color: rgb(226 232 240) !important; /* slate-200 */
        }
        
        /* Improve flag appearance */
        .iti__flag {
          border-radius: 3px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .iti__selected-flag {
          padding: 0 4px 0 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 44px !important;
        }
        
        .dark .iti__selected-dial-code {
          color: rgb(226 232 240) !important; /* slate-200 */
        }
        
        /* Responsive styles for mobile - CRITICAL - FIX DOUBLE SCROLLBAR */
        @media (max-width: 640px) {
          .iti__dropdown-content {
            position: fixed !important;
            max-height: 60vh !important;
            width: calc(100vw - 48px) !important;
            left: 24px !important;
            right: 24px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 9999 !important;
            overflow: hidden !important; /* Remove outer scrollbar */
          }
          
          .iti__country-list {
            max-height: 60vh !important;
            overflow-y: auto !important; /* Single scrollbar on inner list */
          }
          
          .iti__selected-flag {
            padding: 0 8px 0 12px !important;
          }
        }
        
        /* Fix autofill white background in dark mode */
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus,
        .dark input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgb(15 23 42) inset !important;
          -webkit-text-fill-color: rgb(226 232 240) !important;
          caret-color: rgb(226 232 240) !important;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('intl-tel-input-dark-mode');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      return () => {
        const styleToRemove = document.getElementById('intl-tel-input-dark-mode');
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }, []);

    // Handle input change with country-specific max length
    const handleChange = (newValue: string) => {
      // For India, limit to 10 digits (national number only)
      if (selectedCountry === 'in') {
        const digitsOnly = newValue.replace(/\D/g, '');
        if (digitsOnly.length <= 10) {
          onChange(newValue);
        }
      } else {
        onChange(newValue);
      }
    };

    return (
      <div className="relative w-full flex flex-col group">
        <IntlTelInput
          initOptions={{
            initialCountry: 'auto',
            geoIpLookup: function (success, failure) {
              fetch('https://ipapi.co/json')
                .then((res) => res.json())
                .then((data) => success(data.country_code))
                .catch(() => success('in')); // Fallback to India
            },
            utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/utils.js',
            strictMode: false, // Disable strict mode to avoid utils error
            separateDialCode: true,
            dropdownContainer: typeof document !== 'undefined' ? document.body : undefined,
            formatOnDisplay: false, // Disable formatting to avoid utils dependency
          }}
          initialValue={value}
          onChangeNumber={handleChange}
          onChangeCountry={(country) => {
            setSelectedCountry(country);
          }}
          inputProps={{
            ref: ref as any,
            className: cn(
              'flex h-12 w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 text-[14px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:text-slate-100',
              error ? 'border-red-500 focus-visible:ring-red-500' : 'hover:border-slate-300 dark:hover:border-slate-600',
              className,
              '!pl-[46px]' // 44px + 2px to move text right
            ),
            placeholder: 'Enter your phone number',
            maxLength: selectedCountry === 'in' ? 10 : 15,
          }}
        />
        {error && <span className="text-[12px] font-bold text-red-500 mt-1.5">{error}</span>}
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

// Custom validator for react-hook-form using libphonenumber-js
export const validatePhoneNumber = (value: string | undefined) => {
  if (!value) return true; // Let required validation handle empty check if needed
  
  try {
    const phoneNumber = parsePhoneNumberWithError(value);
    
    if (phoneNumber.country === 'IN') {
      // Hard constraint for India: exactly 10 digits national number
      return phoneNumber.nationalNumber.length === 10;
    }
    
    return phoneNumber.isValid();
  } catch (error) {
    return false;
  }
};
