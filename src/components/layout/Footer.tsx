import { Link } from 'react-router-dom';
import { Heart, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Well<span className="text-primary">Sathi</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Your trusted companion for finding the best healthcare. Book appointments with top clinics near you in seconds.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                <MapPin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Phone className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
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
            </ul>
          </div>

          {/* For Clinics */}
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
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} WellSathi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
