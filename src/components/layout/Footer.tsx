import { Link } from 'react-router-dom';
import { Heart, MapPin, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function Footer() {
  const { user } = useAuthStore();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group cursor-pointer">
               <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 group-hover:scale-105 transition-transform duration-300 p-1.5">
                 <img src="/favicon.ico" alt="WellSathi Logo" className="w-full h-full object-contain" />
               </div>
               <span className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">
                 WellSathi
               </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Your trusted companion for finding the best healthcare. Book appointments with top clinics near you in seconds.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <a href="mailto:support@wellsathi.in" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">support@wellsathi.in</span>
              </a>
              <a href="tel:+918434668180" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:inline">+91 8434668180</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">
                  Find Clinics
                </Link>
              </li>
              {!user && (
                <>
                  <li>
                    <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth?mode=signup" className="text-muted-foreground hover:text-primary transition-colors">
                      Register
                    </Link>
                  </li>
                </>
              )}
              {user && (
                <li>
                  <Link to="/dashboard/user" className="text-muted-foreground hover:text-primary transition-colors">
                    My Appointments
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* For Clinics */}
          {!user && (
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Clinics</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/auth?mode=signup&type=clinic" className="text-muted-foreground hover:text-primary transition-colors">
                    Register Your Clinic
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/clinic" className="text-muted-foreground hover:text-primary transition-colors">
                    Clinic Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} WellSathi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
