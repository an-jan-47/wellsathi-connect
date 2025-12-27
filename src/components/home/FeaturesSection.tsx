import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, Clock, Shield } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Easy Search',
    description: 'Find clinics by location, specialty, or ratings. Filter results to match your needs.',
  },
  {
    icon: Calendar,
    title: 'Quick Booking',
    description: 'Book appointments in seconds. No account required for your first visit.',
  },
  {
    icon: Clock,
    title: 'Real-time Slots',
    description: 'See available time slots instantly. No more phone calls or waiting.',
  },
  {
    icon: Shield,
    title: 'Verified Clinics',
    description: 'All clinics are verified for quality. Read reviews from real patients.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why Choose WellSathi?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We make finding and booking healthcare appointments simple and stress-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant="interactive"
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
