import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import ClinicProfile from "./pages/ClinicProfile";
import Book from "./pages/Book";
import UserDashboard from "./pages/UserDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/search" element={<Search />} />
        <Route path="/clinic/:id" element={<ClinicProfile />} />
        <Route path="/book/:clinicId" element={<Book />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
        <Route path="/dashboard/clinic" element={<ClinicDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
