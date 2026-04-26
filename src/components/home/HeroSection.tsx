import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Grid, Loader2, Navigation } from 'lucide-react';
import { getUniqueCities } from '@/services/clinicService';
import { SPECIALIZATIONS } from '@/constants';
import { getSpecialtyIcon } from '@/constants/icons';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function HeroSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Autocomplete & logic states
  const [dbCities, setDbCities] = useState<string[]>([]);
  const [searchLocations, setSearchLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [geolocationRequested, setGeolocationRequested] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const specialtyRef = useRef<HTMLDivElement>(null);
  
  const debouncedLocation = useDebouncedValue(location, 400);

  // Fetch db cities on mount
  useEffect(() => {
    getUniqueCities()
      .then((data) => setDbCities(data))
      .catch(console.error);
  }, []);

  // Fetch from global location API if user types
  useEffect(() => {
    if (debouncedLocation.length > 2) {
      setIsLoadingLocation(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          debouncedLocation
        )}&countrycodes=in&featuretype=city&limit=5`
      )
        .then((res) => res.json())
        .then((data) => {
          // Extract the first part of the display name (usually the city name)
          const places = data.map((d: any) => d.display_name.split(',')[0].trim());
          setSearchLocations(Array.from(new Set(places as string[])));
          setIsLoadingLocation(false);
        })
        .catch((err) => {
          console.error('Location search failed', err);
          setIsLoadingLocation(false);
        });
    } else {
      setSearchLocations([]);
    }
  }, [debouncedLocation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (specialtyRef.current && !specialtyRef.current.contains(event.target as Node)) {
        setShowSpecialtyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (specialty) params.set('specialty', specialty);
    navigate(`/search?${params.toString()}`);
  };

  const handleGeolocation = () => {
    if (location || geolocationRequested) return;

    setGeolocationRequested(true);
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
            );
            const data = await res.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county;
            if (city) {
              setLocation(city);
            }
          } catch (error) {
            console.error('Reverse geocoding failed', error);
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.warn('Geolocation denied or error:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  };

  const filteredCities = location.length > 2 
    ? searchLocations 
    : dbCities.filter((c) => c.toLowerCase().includes(location.toLowerCase()));

  const filteredSpecialties = SPECIALIZATIONS.filter((s) =>
    s.toLowerCase().includes(specialty.toLowerCase())
  );

  return (
    <section className="relative bg-background dark:bg-background pt-20 pb-12 md:pt-32 md:pb-18 min-h-[480px] md:min-h-[600px]">
      {/* Subtle radial background matching the design */}
      <div className="absolute inset-0 top-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-white to-white dark:from-slate-800/30 dark:via-background dark:to-background pointer-events-none"></div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-black uppercase tracking-widest mb-10 animate-fade-in hover:scale-105 transition-transform cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Trusted by 10,000+ patients
          </div>

          {/* Main Headline */}
          <h1 className="text-[46px] md:text-[64px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6 animate-in slide-in-from-bottom-4 duration-700 ease-out">
            Your Health, <span className="text-primary">Our Priority</span>
          </h1>

          <p className="text-[17px] text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-150 fill-mode-both">
            Find and book appointments with the best clinics near you.
            <br className="hidden sm:block" />
            Quick, easy, and hassle-free.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            aria-label="Search for clinics"
            className="flex flex-col md:flex-row items-center max-w-[700px] mx-auto bg-white dark:bg-slate-800 rounded-2xl md:rounded-full p-2 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both relative z-20 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] transition-shadow gap-2 md:gap-0"
          >
            {/* Location Input */}
            <div
              ref={locationRef}
              className="relative flex-1 w-full md:border-r border-slate-100 dark:border-slate-700 flex items-center pr-4 rounded-xl md:rounded-none bg-slate-50 dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent"
            >
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                {isLoadingLocation ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <MapPin className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <input
                id="location-search"
                aria-label="Enter your city"
                placeholder="Enter your city..."
                value={location}
                onFocus={() => {
                  setShowLocationDropdown(true);
                  handleGeolocation();
                }}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationDropdown(true);
                }}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none h-full py-4"
              />
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar z-50 py-2">
                  <div
                    className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-primary text-sm font-medium border-b border-slate-50 dark:border-slate-700"
                    onClick={() => {
                      setGeolocationRequested(false);
                      handleGeolocation();
                    }}
                  >
                    <Navigation className="h-4 w-4 shrink-0" />
                    Use my current location
                  </div>
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={city}
                        className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                        onClick={() => {
                          setLocation(city);
                          setShowLocationDropdown(false);
                        }}
                      >
                        {city}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
                      No locations found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specialty Input */}
            <div
              ref={specialtyRef}
              className="relative flex-1 w-full flex items-center pr-4 rounded-xl md:rounded-none bg-slate-50 dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent"
            >
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                <Grid className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="specialty-search"
                aria-label="Specialty (optional)"
                placeholder="Specialty (optional)"
                value={specialty}
                onFocus={() => setShowSpecialtyDropdown(true)}
                onChange={(e) => {
                  setSpecialty(e.target.value);
                  setShowSpecialtyDropdown(true);
                }}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none h-full py-4"
              />
              {/* Specialty Dropdown */}
              {showSpecialtyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar z-50 py-2">
                  {filteredSpecialties.length > 0 ? (
                    filteredSpecialties.map((spec) => {
                      const Icon = getSpecialtyIcon(spec);
                      return (
                        <div
                          key={spec}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                          onClick={() => {
                            setSpecialty(spec);
                            setShowSpecialtyDropdown(false);
                            setTimeout(() => handleSearch(), 100);
                          }}
                        >
                          <Icon className="w-4 h-4 text-primary opacity-70 shrink-0" />
                          {spec}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
                      No specialties found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              aria-label="Search clinics"
              className="w-full md:w-auto mt-2 md:mt-0 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] rounded-xl md:rounded-full px-8 py-4 flex items-center justify-center gap-2 transition-all duration-100 will-change-transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Search className="h-4 w-4 stroke-[3]" />
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
