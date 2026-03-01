import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, IndianRupee, Clock } from 'lucide-react';
import type { Clinic } from '@/types';

interface ClinicCardProps {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  return (
    <Card variant="interactive" className="overflow-hidden group h-full">
      <Link
        to={`/clinic/${clinic.id}`}
        className="block focus-visible:outline-none"
        aria-label={`View ${clinic.name}`}
      >
        <div className="aspect-[16/9] relative bg-muted overflow-hidden">
          {clinic.image_url ? (
            <img
              src={clinic.image_url}
              alt={clinic.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-foreground/50">
                {clinic.name.charAt(0)}
              </span>
            </div>
          )}
          {clinic.rating && clinic.rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm text-sm font-semibold">
              <Star className="h-4 w-4 text-warning fill-warning" />
              {Number(clinic.rating).toFixed(1)}
            </div>
          )}
        </div>

        <CardContent className="p-5 pb-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {clinic.name}
            </h3>
            <div className="flex items-center gap-1 text-primary font-bold whitespace-nowrap">
              <IndianRupee className="h-4 w-4" />
              {clinic.fees}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{clinic.address}, {clinic.city}</span>
          </div>

          {clinic.specializations && clinic.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {clinic.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="muted" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {clinic.specializations.length > 3 && (
                <Badge variant="muted" className="text-xs">
                  +{clinic.specializations.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>

      <CardContent className="p-5 pt-0">
        <Button asChild className="w-full">
          <Link to={`/clinic/${clinic.id}`}>
            <Clock className="h-4 w-4 mr-2" />
            View Slots
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
