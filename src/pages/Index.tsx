import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { PopularClinicsSection } from '@/components/home/PopularClinicsSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { CTASection } from '@/components/home/CTASection';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const Index = () => {
  const navigate = useNavigate();
  const { user, roles, isInitialized, isLoading } = useAuthStore();

  useDocumentTitle('Find & Book Top-Rated Clinics');

  // Redirect clinic users to their dashboard
  useEffect(() => {
    if (user && isInitialized && !isLoading) {
      if (roles.includes('clinic')) {
        navigate('/dashboard/clinic');
      } else if (roles.includes('admin')) {
        navigate('/admin');
      }
      // Regular users stay on the home page
    }
  }, [user, roles, isInitialized, isLoading, navigate]);

  return (
    <Layout>
      <HeroSection />
      <PopularClinicsSection />
      <FeaturesSection />
      {!user && <CTASection />}
    </Layout>
  );
};

export default Index;
