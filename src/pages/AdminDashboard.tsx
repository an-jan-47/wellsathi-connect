import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2, CheckCircle2, XCircle, Loader2, MapPin, IndianRupee,
  Users, CalendarCheck, Search, Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Clinic } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, isInitialized } = useAuthStore();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalAppointments: 0 });

  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!user) navigate('/auth');
      else if (!hasRole('admin')) {
        toast.error('You do not have admin access');
        navigate('/');
      }
    }
  }, [user, hasRole, authLoading, isInitialized, navigate]);

  useEffect(() => {
    if (user && hasRole('admin')) {
      fetchClinics();
      fetchStats();
    }
  }, [user]);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClinics(data as Clinic[] || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        totalUsers: usersRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateClinicStatus = async (clinicId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase.from('clinics').update({ is_approved: isApproved }).eq('id', clinicId);
      if (error) throw error;
      setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, is_approved: isApproved } : c));
      toast.success(`Clinic ${isApproved ? 'approved' : 'rejected'}`);
    } catch {
      toast.error('Failed to update clinic status');
    }
  };

  const filteredClinics = clinics.filter((c) => {
    const matchFilter = filter === 'all' || (filter === 'pending' ? !c.is_approved : c.is_approved);
    const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (authLoading || !isInitialized || isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="gradient-hero py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage clinics, users and platform</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Building2 className="h-5 w-5" />} label="Total Clinics" value={clinics.length} color="primary" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Approved" value={clinics.filter(c => c.is_approved).length} color="success" />
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.totalUsers} color="info" />
          <StatCard icon={<CalendarCheck className="h-5 w-5" />} label="Total Bookings" value={stats.totalAppointments} color="warning" />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clinics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11" />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'ghost'} onClick={() => setFilter(f)} className="capitalize">
                {f} {f === 'pending' && `(${clinics.filter(c => !c.is_approved).length})`}
              </Button>
            ))}
          </div>
        </div>

        {/* Clinics List */}
        {filteredClinics.length === 0 ? (
          <Card className="bg-muted/50"><CardContent className="py-8 text-center text-muted-foreground">No clinics found</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filteredClinics.map((clinic) => (
              <Card key={clinic.id} variant="elevated">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">{clinic.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{clinic.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{clinic.city}</span>
                          <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" />{clinic.fees}</span>
                          <span>Registered {format(parseISO(clinic.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {clinic.specializations && clinic.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {clinic.specializations.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="muted" className="text-xs">{spec}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedClinic(clinic)}>
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                      <Badge variant={clinic.is_approved ? 'success' : 'warning'}>
                        {clinic.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                      {!clinic.is_approved ? (
                        <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => updateClinicStatus(clinic.id, true)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateClinicStatus(clinic.id, false)}>
                          <XCircle className="h-4 w-4 mr-1" />Revoke
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

      {/* Clinic Detail Dialog */}
      <Dialog open={!!selectedClinic} onOpenChange={(o) => !o && setSelectedClinic(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedClinic?.name}</DialogTitle></DialogHeader>
          {selectedClinic && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">City</span><p className="font-medium">{selectedClinic.city}</p></div>
                <div><span className="text-muted-foreground">Fee</span><p className="font-medium">₹{selectedClinic.fees}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium">{selectedClinic.address}</p></div>
                <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{selectedClinic.phone || '—'}</p></div>
                <div><span className="text-muted-foreground">Rating</span><p className="font-medium">{selectedClinic.rating || '—'}</p></div>
                <div><span className="text-muted-foreground">Registration #</span><p className="font-medium">{selectedClinic.registration_number || '—'}</p></div>
                <div><span className="text-muted-foreground">Status</span><Badge variant={selectedClinic.is_approved ? 'success' : 'warning'}>{selectedClinic.is_approved ? 'Approved' : 'Pending'}</Badge></div>
              </div>
              {selectedClinic.description && (
                <div><span className="text-sm text-muted-foreground">Description</span><p className="text-sm mt-1">{selectedClinic.description}</p></div>
              )}
              {selectedClinic.specializations && selectedClinic.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedClinic.specializations.map(s => <Badge key={s} variant="accent">{s}</Badge>)}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {!selectedClinic.is_approved ? (
                  <Button className="flex-1" onClick={() => { updateClinicStatus(selectedClinic.id, true); setSelectedClinic(prev => prev ? { ...prev, is_approved: true } : null); }}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                  </Button>
                ) : (
                  <Button variant="destructive" className="flex-1" onClick={() => { updateClinicStatus(selectedClinic.id, false); setSelectedClinic(prev => prev ? { ...prev, is_approved: false } : null); }}>
                    <XCircle className="h-4 w-4 mr-2" />Revoke
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}
