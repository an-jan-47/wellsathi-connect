import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import { useSearchClinics } from '@/hooks/queries/useClinics';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SPECIALIZATIONS } from '@/constants';
import { Search as SearchIcon, MapPin, SlidersHorizontal, Loader2, List, Map, Star, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/constants';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    maxFees: searchParams.get('maxFees') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
    query: searchParams.get('query') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
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
      <div className="min-h-screen bg-[#fafafa] font-sans">
        
        {/* Header Section */}
        <div className="bg-white pt-6 pb-6 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] relative z-20">
          <div className="container max-w-[1000px] mx-auto text-center md:text-left">
            <span className="text-[11px] font-black text-primary uppercase tracking-widest">Medical Directory</span>
            <h1 className="text-[32px] md:text-[42px] font-black text-slate-900 tracking-tight leading-tight mt-1 mb-6">Explore Specialized Clinics</h1>
            
            {/* Massive Search Bar with Combined Filters */}
            <div className="flex items-center w-full bg-white border-2 border-slate-100 rounded-[28px] md:rounded-full p-2.5 shadow-xl shadow-slate-200/50 relative transition-all focus-within:border-primary/30">
               <div className="flex-1 flex items-center relative pl-4 pr-2">
                 <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4" />
                 <input 
                    value={filters.query}
                    onChange={e => updateParams({ query: e.target.value })}
                    placeholder="Search by clinic name or specialty..."
                    className="w-full bg-transparent pl-10 pr-4 py-3 text-[16px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                 />
                 
                 {/* Combined Filter Icon inside search bar */}
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <button className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-primary transition-colors focus:outline-none shrink-0" aria-label="Filters">
                       <SlidersHorizontal className="w-4.5 h-4.5" />
                     </button>
                   </DropdownMenuTrigger>
                   
                   <DropdownMenuContent className="w-80 p-4 rounded-2xl shadow-2xl border-slate-100 mt-2" align="end">
                      <div className="space-y-4">
                         {/* Location */}
                         <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                            <div className="flex flex-wrap gap-2">
                               <button onClick={() => updateParams({ location: '' })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${!filters.location ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Any Location</button>
                               {['Delhi', 'Mumbai', 'Bangalore', 'Pune'].map(loc => (
                                 <button key={loc} onClick={() => updateParams({ location: loc })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${filters.location === loc ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{loc}</button>
                               ))}
                            </div>
                         </div>
                         
                         {/* Specialty */}
                         <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Specialty</label>
                            <div className="flex flex-wrap gap-2">
                               <button onClick={() => updateParams({ specialty: '' })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${!filters.specialty ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>All</button>
                               {SPECIALIZATIONS.slice(0, 5).map(spec => (
                                 <button key={spec} onClick={() => updateParams({ specialty: spec })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${filters.specialty === spec ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{spec}</button>
                               ))}
                            </div>
                         </div>
                         
                         {/* Rating */}
                         <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Minimum Rating</label>
                            <div className="flex flex-wrap gap-2">
                               <button onClick={() => updateParams({ minRating: '' })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${!filters.minRating ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Any</button>
                               {['4.8', '4.5', '4.0'].map(rating => (
                                 <button key={rating} onClick={() => updateParams({ minRating: rating })} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${filters.minRating === rating ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{rating}+</button>
                               ))}
                            </div>
                         </div>
                      </div>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
               
               <button className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] px-8 py-3.5 rounded-full transition-all active:scale-95 shadow-md shadow-primary/20 shrink-0 ml-2">
                  <SearchIcon className="w-4 h-4" />
                  Search Clinics
               </button>
            </div>
             {/* Mobile search button */}
             <button className="w-full mt-3 flex md:hidden items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] px-8 py-4 rounded-full transition-all active:scale-95 shadow-md shadow-primary/20">
                <SearchIcon className="w-4 h-4" />
                Search Clinics
             </button>

             {/* UI Filter Pill Scrollbar from References */}
             <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide text-left w-full mx-auto justify-start">
               {/* Fixed primary colored all filter block */}
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="flex shrink-0 items-center gap-1.5 px-4 py-2 bg-[#E6F4F1] text-primary border border-primary/10 hover:bg-primary/20 rounded-full text-[13px] font-bold transition-colors">
                     All Specialized <ChevronDown className="w-3.5 h-3.5" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56 p-2 rounded-2xl shadow-xl border-slate-100" align="start">
                    <DropdownMenuItem onClick={() => updateParams({ specialty: '' })} className="font-bold text-[13px] rounded-xl cursor-pointer py-2 px-3">
                       Clear Specialty
                    </DropdownMenuItem>
                    {SPECIALIZATIONS.map(spec => (
                      <DropdownMenuItem key={spec} onClick={() => updateParams({ specialty: spec })} className="font-semibold text-[13px] rounded-xl cursor-pointer py-2 px-3 text-slate-700">
                        {spec}
                      </DropdownMenuItem>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>

               {/* Quick Select Specialty Filters */}
               {SPECIALIZATIONS.slice(0, 4).map(spec => (
                 <button 
                   key={spec} 
                   onClick={() => updateParams({ specialty: spec === filters.specialty ? '' : spec })}
                   className={`flex shrink-0 items-center px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${filters.specialty === spec ? 'bg-[#E6F4F1] text-primary border-primary/20' : 'bg-[#F8F9FA] border-transparent text-slate-700 hover:bg-slate-100'}`}
                 >
                   {spec}
                 </button>
               ))}
               
               {/* Functional Fee Filter */}
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className={`flex shrink-0 items-center gap-1.5 px-4 py-2 border rounded-full text-[13px] font-semibold transition-colors ${filters.maxFees ? 'bg-[#E6F4F1] text-primary border-primary/20' : 'bg-[#F8F9FA] text-slate-700 border-transparent hover:bg-slate-100'}`}>
                     {filters.maxFees ? `Up to ₹${filters.maxFees}` : 'Fee'} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-48 p-2 rounded-2xl shadow-xl border-slate-100" align="start">
                    <DropdownMenuItem onClick={() => updateParams({ maxFees: '' })} className="font-bold text-[13px] rounded-xl cursor-pointer py-2 px-3">
                       Any Fee
                    </DropdownMenuItem>
                    {['500', '1000', '2000', '5000'].map(fee => (
                      <DropdownMenuItem key={fee} onClick={() => updateParams({ maxFees: fee })} className="font-semibold text-[13px] rounded-xl cursor-pointer py-2 px-3 text-slate-700">
                        Up to ₹{fee}
                      </DropdownMenuItem>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="container max-w-[1400px] mx-auto py-8">
          <div className="flex flex-col lg:flex-row gap-8">
             
             {/* Left Column: Listings */}
             <div className="flex-1 flex flex-col min-w-0">
               {isLoading ? (
                 <div className="flex items-center justify-center py-16">
                   <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold shadow-md">
                        {filters.page}
                      </button>
                      <button 
                        disabled={clinics.length < 20}
                        onClick={() => updateParams({ page: filters.page + 1 })}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm max-w-2xl mx-auto w-full">
                   <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                     <SearchIcon className="h-8 w-8 text-slate-300" />
                   </div>
                   <h3 className="text-[22px] font-black text-slate-900 mb-2">No clinics found</h3>
                   <p className="text-[15px] font-medium text-slate-500 max-w-md mx-auto">
                     We couldn't find any medical facilities matching your specific criteria. Try expanding your search area or removing some filters.
                   </p>
                 </div>
               )}
             </div>

             {/* Right Column: Sidebar Map (Desktop Only) */}
             <div className="w-full lg:w-[450px] shrink-0 hidden lg:block overflow-hidden relative">
                <div className="sticky top-[104px] space-y-6">
                   <div className="bg-white rounded-[32px] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.03)] border border-slate-100/60 p-4 flex flex-col">
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
