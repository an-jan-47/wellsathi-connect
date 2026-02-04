import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { supabase } from '@/integrations/supabase/client';
import { Search as SearchIcon, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Clinic } from '@/types';

const SPECIALIZATIONS = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'Dentistry',
  'Urology',
];

type SortOption = 'rating' | 'fees_low' | 'fees_high' | 'name';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    maxFees: searchParams.get('maxFees') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
  });

  useEffect(() => {
    fetchClinics();
  }, [searchParams]);

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const location = searchParams.get('location');
      const specialty = searchParams.get('specialty');
      const maxFees = searchParams.get('maxFees');
      const minRating = searchParams.get('minRating');
      const sortBy = searchParams.get('sortBy') as SortOption || 'rating';

      let query = supabase
        .from('clinics')
        .select('*')
        .eq('is_approved', true)
        .limit(20);

      if (location) {
        query = query.ilike('city', `%${location}%`);
      }

      if (specialty) {
        query = query.contains('specializations', [specialty]);
      }

      if (maxFees) {
        query = query.lte('fees', parseInt(maxFees));
      }

      if (minRating) {
        query = query.gte('rating', parseFloat(minRating));
      }

      // Apply sorting
      switch (sortBy) {
        case 'fees_low':
          query = query.order('fees', { ascending: true });
          break;
        case 'fees_high':
          query = query.order('fees', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'rating':
        default:
          query = query.order('rating', { ascending: false, nullsFirst: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setClinics(data as Clinic[] || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.maxFees) params.set('maxFees', filters.maxFees);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.sortBy && filters.sortBy !== 'rating') params.set('sortBy', filters.sortBy);
    setSearchParams(params);
  };

  const handleSortChange = (value: SortOption) => {
    setFilters({ ...filters, sortBy: value });
    const params = new URLSearchParams(searchParams);
    if (value === 'rating') {
      params.delete('sortBy');
    } else {
      params.set('sortBy', value);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      specialty: '',
      maxFees: '',
      minRating: '',
      sortBy: 'rating',
    });
    setSearchParams(new URLSearchParams());
  };

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-6">Find Clinics</h1>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="City or location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="pl-12 h-12 bg-card"
                />
              </div>
              <Select
                value={filters.specialty}
                onValueChange={(value) => setFilters({ ...filters, specialty: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-full sm:w-[200px] h-12 bg-card">
                  <SelectValue placeholder="Specialty..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="lg" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              <Button type="submit" size="lg" className="gap-2">
                <SearchIcon className="h-5 w-5" />
                Search
              </Button>
            </div>

            {showFilters && (
              <Card variant="glass" className="animate-slide-down">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Max Consultation Fee (₹)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        value={filters.maxFees}
                        onChange={(e) => setFilters({ ...filters, maxFees: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Minimum Rating
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="e.g., 4.0"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Sort By
                      </label>
                      <Select value={filters.sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Highest Rating</SelectItem>
                          <SelectItem value="fees_low">Lowest Fees</SelectItem>
                          <SelectItem value="fees_high">Highest Fees</SelectItem>
                          <SelectItem value="name">Name (A-Z)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clinics.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Found {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
              </p>
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="fees_low">Lowest Fees</SelectItem>
                  <SelectItem value="fees_high">Highest Fees</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No clinics found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search filters or location
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
