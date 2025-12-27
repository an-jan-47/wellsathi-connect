import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Stethoscope, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (specialty) params.set('specialty', specialty);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            Trusted by 10,000+ patients
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 animate-slide-up">
            Your Health,{' '}
            <span className="gradient-text">Our Priority</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 animate-slide-up stagger-1">
            Find and book appointments with the best clinics near you. 
            Quick, easy, and hassle-free.
          </p>

          {/* Search Form */}
          <form 
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto animate-slide-up stagger-2"
          >
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter your city..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-14 text-base"
              />
            </div>
            <div className="relative flex-1">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Specialty (optional)"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="pl-12 h-14 text-base"
              />
            </div>
            <Button type="submit" size="xl" className="gap-2 group">
              <Search className="h-5 w-5" />
              <span>Search</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Quick specialties */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 animate-fade-in stagger-3">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {['General Medicine', 'Dentist', 'Pediatrics', 'Cardiology'].map((spec) => (
              <button
                key={spec}
                onClick={() => navigate(`/search?specialty=${encodeURIComponent(spec)}`)}
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
