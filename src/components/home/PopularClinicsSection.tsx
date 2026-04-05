import { useEffect, useState } from 'react';
import { getPopularClinics } from '@/services/clinicService';
import type { Clinic } from '@/types';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { Sparkles } from 'lucide-react';

export function PopularClinicsSection() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopular() {
      try {
        const data = await getPopularClinics(4);
        setClinics(data);
      } catch (error) {
        console.error('Failed to fetch popular clinics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, []);

  if (loading || clinics.length === 0) {
    return null; // or a skeleton if preferred, but null is fine for progressive enhancement
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold text-slate-900 text-center">Most Popular Clinics</h2>
        </div>
        <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
          Discover top-rated healthcare facilities trusted by patients for their exceptional care and professional service.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} layout="vertical" />
          ))}
        </div>
      </div>
    </section>
  );
}
