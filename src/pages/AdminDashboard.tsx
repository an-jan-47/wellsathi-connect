import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, CheckCircle2, XCircle, Loader2, MapPin, IndianRupee } from 'lucide-react';
import type { Clinic } from '@/types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!hasRole('admin')) {
        toast.error('You do not have admin access');
        navigate('/');
      }
    }
  }, [user, hasRole, authLoading, isInitialized, navigate]);

  useEffect(() => {
    if (user && hasRole('admin')) {
      fetchClinics();
    }
  }, [user]);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClinics(data as Clinic[] || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClinicStatus = async (clinicId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_approved: isApproved })
        .eq('id', clinicId);

      if (error) throw error;

      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, is_approved: isApproved } : c))
      );
      toast.success(`Clinic ${isApproved ? 'approved' : 'rejected'}`);
    } catch (error) {
      toast.error('Failed to update clinic status');
    }
  };

  const filteredClinics = clinics.filter((c) => {
    if (filter === 'pending') return !c.is_approved;
    if (filter === 'approved') return c.is_approved;
    return true;
  });

  if (authLoading || !isInitialized || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage clinics and approvals</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinics.length}</p>
                <p className="text-sm text-muted-foreground">Total Clinics</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics.filter((c) => c.is_approved).length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics.filter((c) => !c.is_approved).length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Clinics List */}
        {filteredClinics.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              No clinics found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClinics.map((clinic) => (
              <Card key={clinic.id} variant="elevated">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">
                          {clinic.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{clinic.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {clinic.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {clinic.fees}
                          </span>
                        </div>
                        {clinic.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {clinic.specializations.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="muted" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={clinic.is_approved ? 'success' : 'warning'}>
                        {clinic.is_approved ? 'Approved' : 'Pending'}
                      </Badge>

                      {!clinic.is_approved ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateClinicStatus(clinic.id, true)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateClinicStatus(clinic.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
