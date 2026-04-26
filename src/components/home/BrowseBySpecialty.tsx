import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpecialtyIcon } from '@/constants/icons';
import { Grid, ChevronLeft, ChevronRight } from 'lucide-react';

// Top 11 statistically most common specialties
const TOP_SPECIALTIES = [
  'General Medicine',
  'Dentistry',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'ENT',
];

// View All Card Component
const ViewAllCard = React.memo(() => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/search')}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 shadow-sm hover:shadow-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-all duration-100 ease-out w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 snap-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="w-14 h-14 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors duration-100 ease-out">
        <Grid className="w-7 h-7 text-primary transition-transform duration-100 ease-out will-change-transform group-hover:scale-110" />
      </div>
      <span className="text-[13px] font-bold text-primary text-center leading-tight">
        View All<br />Specialties
      </span>
    </button>
  );
});

ViewAllCard.displayName = 'ViewAllCard';

// Memoized Specialty Card to prevent unnecessary re-renders
const SpecialtyCard = React.memo(({ specialty }: { specialty: string }) => {
  const navigate = useNavigate();
  const Icon = getSpecialtyIcon(specialty);

  const handleClick = () => {
    navigate(`/search?specialty=${encodeURIComponent(specialty)}`);
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      aria-label={`Browse ${specialty} clinics`}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:shadow-none hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-100 ease-out w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 snap-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors duration-100 ease-out">
        <Icon className="w-7 h-7 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-transform duration-100 ease-out will-change-transform group-hover:scale-110" />
      </div>
      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-primary transition-colors duration-100">
        {specialty}
      </span>
    </button>
  );
});

SpecialtyCard.displayName = 'SpecialtyCard';

// Skeleton loader for CLS mitigation
const SpecialtySkeleton = () => (
  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700/50 w-[calc((100vw-5rem)/3.5)] lg:w-[calc((100vw-10rem)/8.5)] h-[130px] flex-shrink-0 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 mb-3" />
    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
  </div>
);

export function BrowseBySpecialty() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate network delay to show loading skeletons (as per requirements)
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      handleScroll();
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading]);

  return (
    <section id="specialties" className="py-12 bg-white dark:bg-background" aria-label="Browse by Specialty">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Browse Clinics by Specialty
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">
            Find experienced doctors across all medical specialties.
          </p>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-[45%] -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 md:p-2 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-[45%] -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 md:p-2 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth touch-pan-x hide-scrollbar"
            role="list"
          >
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => <SpecialtySkeleton key={i} />)
              : TOP_SPECIALTIES.map((spec) => (
                  <div role="listitem" key={spec} className="flex-shrink-0 lg:flex-shrink">
                    <SpecialtyCard specialty={spec} />
                  </div>
                ))}
            <div role="listitem" className="flex-shrink-0 lg:flex-shrink">
              <ViewAllCard />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        /* Hide scrollbar for a cleaner horizontal scroll look on mobile */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
