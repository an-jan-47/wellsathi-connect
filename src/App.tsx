import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"

// Eagerly loaded pages (always needed)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (only loaded when navigated to)
const Search = lazy(() => import("./pages/Search"));
const ClinicProfile = lazy(() => import("./pages/ClinicProfile"));
const Book = lazy(() => import("./pages/Book"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const ClinicDashboard = lazy(() => import("./pages/ClinicDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ClinicRegistration = lazy(() => import("./pages/ClinicRegistration"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Analytics />
      <SpeedInsights />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<Search />} />
          <Route path="/clinic/:id" element={<ClinicProfile />} />
          <Route path="/register-clinic" element={<ClinicRegistration />} />

          {/* Auth required */}
          <Route path="/book/:clinicId" element={
            <ProtectedRoute>
              <Book />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/user" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Clinic role required */}
          <Route path="/dashboard/clinic" element={
            <ProtectedRoute roles={['clinic', 'admin']}>
              <ClinicDashboard />
            </ProtectedRoute>
          } />

          {/* Admin role required */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <AppContent />
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
