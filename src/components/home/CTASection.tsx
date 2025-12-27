import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2 } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 gradient-hero">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Are You a Clinic Owner?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join WellSathi to manage appointments, reach more patients, and grow your practice. 
            It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild className="group">
              <Link to="/auth?mode=signup&type=clinic">
                Register Your Clinic
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/search">
                Browse as Patient
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
