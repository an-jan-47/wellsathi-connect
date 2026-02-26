import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader2 } from 'lucide-react';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes before data is stale
      gcTime: 15 * 60 * 1000,     // 15 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<Search />} />
          <Route path="/clinic/:id" element={<ClinicProfile />} />

          {/* Auth required */}
          <Route path="/register-clinic" element={
            <ProtectedRoute>
              <ClinicRegistration />
            </ProtectedRoute>
          } />
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
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <AppContent />
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
