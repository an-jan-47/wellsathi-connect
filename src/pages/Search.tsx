import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import { useSearchClinics } from '@/hooks/queries/useClinics';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SPECIALIZATIONS } from '@/constants';
import { getSpecialtyIcon } from '@/constants/icons';
import { Search as SearchIcon, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/constants';
import { ClinicCardSkeleton } from '@/components/common/SkeletonLoaders';

// Top most popular specialties for quick filters
const TOP_QUICK_FILTER_SPECIALTIES = [
  'General Medicine',
  'Dentistry',
  'Cardiology',
  'Dermatology',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    maxFees: searchParams.get('maxFees') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
    query: searchParams.get('query') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    availability: searchParams.get('availability') || '',
    experience: searchParams.get('experience') || '',
  });

  // Debounce the search query by 300ms to prevent excessive API calls
  const debouncedQuery = useDebouncedValue(filters.query, 300);

  // Dynamic page title for SEO
  useDocumentTitle(
    filters.specialty
      ? `${filters.specialty} Clinics – Search`
      : 'Search Clinics'
  );

  const searchFilters = {
    location: searchParams.get('location') || undefined,
    specialty: searchParams.get('specialty') || undefined,
    maxFees: searchParams.get('maxFees') || undefined,
    minRating: searchParams.get('minRating') || undefined,
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
    query: debouncedQuery || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
  };

  const { data: clinics = [], isLoading } = useSearchClinics(searchFilters);

  // Handle scroll for seamless filter bar transition
  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past 200px
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateParams = (updates: any) => {
     const newFilters = { ...filters, ...updates };
     setFilters(newFilters);
     const params = new URLSearchParams();
     Object.entries(newFilters).forEach(([key, val]) => {
        if (val && val !== 'rating' && val !== 'all') params.set(key, val as string);
     });
     setSearchParams(params);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background dark:bg-background font-sans">
        
        {/* Hero Header Section */}
        <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 pt-8 md:pt-12 pb-2 md:pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="container max-w-[1000px] mx-auto px-4">
            {/* Title & Subtitle - Show only title on Mobile */}
            <div className="text-center mb-4 md:mb-6">
              <h1 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2 md:mb-3">
                Find Your Perfect Clinic
              </h1>
              <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto hidden md:block">
                Search from thousands of verified clinics and book appointments instantly
              </p>
            </div>
            
            {/* Search Bar - Improved Mobile Layout */}
            <div className="flex items-center w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-full p-2 md:p-2.5 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 relative transition-all focus-within:border-primary/40 focus-within:shadow-2xl">
              <div className="flex-1 flex items-center relative pl-2 md:pl-4 pr-2">
                <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 md:left-4" aria-hidden="true" />
                <input 
                  value={filters.query}
                  onChange={e => updateParams({ query: e.target.value })}
                  placeholder="Search clinics..."
                  aria-label="Search clinics"
                  className="w-full bg-transparent pl-9 md:pl-10 pr-2 md:pr-4 py-3 md:py-3 text-sm md:text-base font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                
                {/* Advanced Filters Button - Better Mobile Placement */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0" 
                      aria-label="Open advanced filters"
                    >
                      <SlidersHorizontal className="w-4 md:w-4.5 h-4 md:h-4.5" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent className="w-80 max-h-[70vh] overflow-y-auto custom-scrollbar p-4 rounded-2xl shadow-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-2" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="space-y-4">
                      {/* Location */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Location</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateParams({ location: '' })} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.location ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            Any Location
                          </button>
                          {['Delhi', 'New Delhi'].map(loc => (
                            <button 
                              key={loc} 
                              onClick={() => updateParams({ location: loc })} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.location === loc ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Specialty */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Specialty</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateParams({ specialty: '' })} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.specialty ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            All
                          </button>
                          {SPECIALIZATIONS.slice(0, 12).map(spec => (
                            <button 
                              key={spec} 
                              onClick={() => updateParams({ specialty: spec })} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.specialty === spec ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Minimum Rating</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateParams({ minRating: '' })} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.minRating ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            Any
                          </button>
                          {['4.8', '4.5', '4.0', '3.5'].map(rating => (
                            <button 
                              key={rating} 
                              onClick={() => updateParams({ minRating: rating })} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.minRating === rating ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {rating}+
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Availability</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateParams({ availability: '' })} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.availability ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            Any Time
                          </button>
                          {['Today', 'Tomorrow', 'This Week'].map(avail => (
                            <button 
                              key={avail} 
                              onClick={() => updateParams({ availability: avail })} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.availability === avail ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {avail}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Doctor Experience</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateParams({ experience: '' })} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.experience ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            Any
                          </button>
                          {['5+ years', '10+ years', '15+ years'].map(exp => (
                            <button 
                              key={exp} 
                              onClick={() => updateParams({ experience: exp })} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.experience === exp ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <button 
                className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-all active:scale-95 shadow-md shadow-primary/20 shrink-0 ml-2"
                aria-label="Search clinics"
              >
                <SearchIcon className="w-4 h-4" aria-hidden="true" />
                Search
              </button>
            </div>
            
            {/* Mobile search button */}
            <button 
              className="w-full mt-3 flex md:hidden items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-3.5 rounded-full transition-all active:scale-95 shadow-md shadow-primary/20"
              aria-label="Search clinics"
            >
              <SearchIcon className="w-4 h-4" aria-hidden="true" />
              Search
            </button>
          </div>
        </div>

        {/* Quick Filters Section - Sticky, Scrollable, Seamless Transition */}
        <div className={`sticky top-[80px] z-10 transition-all duration-300 py-3 filter-bar ${isScrolled ? 'scrolled' : ''}`}>
          <div className="w-full overflow-x-auto custom-scrollbar">
            <div className="flex items-center justify-start md:justify-center gap-2 px-4 min-w-max md:min-w-0">
              {/* All Specialties Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full text-xs sm:text-sm font-bold transition-colors"
                    aria-label="Select specialty"
                  >
                    <span className="hidden sm:inline">{filters.specialty || 'All Specialties'}</span>
                    <span className="sm:hidden">{filters.specialty || 'All'}</span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[400px] overflow-y-auto custom-scrollbar" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuItem 
                    onClick={() => updateParams({ specialty: '' })} 
                    className="font-bold text-sm rounded-xl cursor-pointer py-2 px-3 dark:text-slate-200"
                  >
                    Clear Specialty
                  </DropdownMenuItem>
                  {SPECIALIZATIONS.map(spec => {
                    const Icon = getSpecialtyIcon(spec);
                    return (
                      <DropdownMenuItem 
                        key={spec} 
                        onClick={() => updateParams({ specialty: spec })} 
                        className="font-semibold text-sm rounded-xl cursor-pointer py-2 px-3 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                      >
                        <Icon className="w-3.5 h-3.5 text-primary opacity-70" aria-hidden="true" />
                        {spec}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Select Specialty Filters */}
              {TOP_QUICK_FILTER_SPECIALTIES.map(spec => {
                const Icon = getSpecialtyIcon(spec);
                return (
                  <button 
                    key={spec} 
                    onClick={() => updateParams({ specialty: spec === filters.specialty ? '' : spec })}
                    className={`flex shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${
                      filters.specialty === spec 
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/20' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    aria-label={`Filter by ${spec}`}
                  >
                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${filters.specialty === spec ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} aria-hidden="true" />
                    <span className="whitespace-nowrap">{spec}</span>
                  </button>
                );
              })}
              
              {/* Fee Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      filters.maxFees 
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    aria-label="Filter by consultation fee"
                  >
                    {filters.maxFees ? `₹${filters.maxFees}` : 'Fee'} <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuItem 
                    onClick={() => updateParams({ maxFees: '' })} 
                    className="font-bold text-sm rounded-xl cursor-pointer py-2 px-3 dark:text-slate-200"
                  >
                    Any Fee
                  </DropdownMenuItem>
                  {['500', '1000', '2000', '5000'].map(fee => (
                    <DropdownMenuItem 
                      key={fee} 
                      onClick={() => updateParams({ maxFees: fee })} 
                      className="font-semibold text-sm rounded-xl cursor-pointer py-2 px-3 text-slate-700 dark:text-slate-300"
                    >
                      Up to ₹{fee}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Availability Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      filters.availability 
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    aria-label="Filter by availability"
                  >
                    <span className="whitespace-nowrap">{filters.availability || 'Availability'}</span> <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuItem 
                    onClick={() => updateParams({ availability: '' })} 
                    className="font-bold text-sm rounded-xl cursor-pointer py-2 px-3 dark:text-slate-200"
                  >
                    Any Time
                  </DropdownMenuItem>
                  {['Today', 'Tomorrow', 'This Week'].map(avail => (
                    <DropdownMenuItem 
                      key={avail} 
                      onClick={() => updateParams({ availability: avail })} 
                      className="font-semibold text-sm rounded-xl cursor-pointer py-2 px-3 text-slate-700 dark:text-slate-300"
                    >
                      {avail}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container max-w-[1400px] mx-auto py-8 px-4">
          <div className="flex flex-col lg:flex-row gap-8">
             
             {/* Left Column: Listings */}
             <div className="flex-1 flex flex-col min-w-0">
               {isLoading ? (
                 <div className="space-y-4">
                   <ClinicCardSkeleton />
                   <ClinicCardSkeleton />
                   <ClinicCardSkeleton />
                   <ClinicCardSkeleton />
                 </div>
               ) : clinics.length > 0 ? (
                 <div className="flex flex-col gap-6">
                   {clinics.map(clinic => (
                     <ClinicCard key={clinic.id} clinic={clinic} />
                   ))}

                   {/* Modern Pagination UI */}
                   <div className="flex items-center justify-center gap-2 mt-8 mb-12">
                      <button 
                        disabled={filters.page <= 1}
                        onClick={() => updateParams({ page: Math.max(1, filters.page - 1) })}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold shadow-md"
                        aria-label={`Current page ${filters.page}`}
                        aria-current="page"
                      >
                        {filters.page}
                      </button>
                      <button 
                        disabled={clinics.length < 20}
                        onClick={() => updateParams({ page: filters.page + 1 })}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                   </div>
                 </div>
               ) : (
                 <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-16 text-center shadow-sm max-w-2xl mx-auto w-full">
                   <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                     <SearchIcon className="h-8 w-8 text-slate-300 dark:text-slate-500" aria-hidden="true" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No clinics found</h3>
                   <p className="text-base font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                     We couldn't find any medical facilities matching your specific criteria. Try expanding your search area or removing some filters.
                   </p>
                 </div>
               )}
             </div>

             {/* Right Column: Sidebar Map (Desktop Only) */}
             <div className="w-full lg:w-[450px] shrink-0 hidden lg:block overflow-hidden relative">
                <div className="sticky top-[104px] space-y-6">
                   <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-4 flex flex-col">
                     <ClinicMap
                       clinics={clinics}
                       className="aspect-[4/3] rounded-3xl overflow-hidden"
                       onClinicClick={(id) => navigate(`/clinic/${id}`)}
                     />
                   </div>
                </div>
             </div>

          </div>
        </div>

      </div>
    </Layout>
  );
}
