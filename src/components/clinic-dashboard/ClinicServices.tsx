import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, IndianRupee, Loader2, X, Check, Stethoscope } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface Service {
  id: string;
  clinic_id: string;
  service_name: string;
  fee: number;
  created_at: string;
}

interface Props {
  clinicId: string;
}

export function ClinicServices({ clinicId }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ serviceName: '', fee: 0 });

  useEffect(() => {
    fetchServices();
  }, [clinicId]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('service_name');
      if (error) throw error;
      setServices(data || []);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const createService = async () => {
    if (!form.serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('clinic_services').insert({
        clinic_id: clinicId,
        service_name: form.serviceName.trim(),
        fee: form.fee,
      });
      if (error) throw error;
      toast.success('Service added');
      setForm({ serviceName: '', fee: 0 });
      setDialogOpen(false);
      fetchServices();
    } catch {
      toast.error('Failed to add service');
    } finally {
      setIsSaving(false);
    }
  };

  const updateService = async (id: string) => {
    if (!form.serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('clinic_services').update({
        service_name: form.serviceName.trim(),
        fee: form.fee,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Service updated');
      setEditingId(null);
      fetchServices();
    } catch {
      toast.error('Failed to update service');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Service removed');
      fetchServices();
    } catch {
      toast.error('Failed to remove service');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (o) setForm({ serviceName: '', fee: 0 }); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-2 block">Service Name *</label><Input value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} placeholder="e.g. General Consultation" /></div>
              <div><label className="text-sm font-medium mb-2 block">Fee (₹)</label><Input type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: parseInt(e.target.value) || 0 })} /></div>
              <Button className="w-full" onClick={createService} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Service'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No services added yet</p>
            <p className="text-sm mt-1">Add services your clinic offers</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((svc) => (
            <Card key={svc.id}>
              <CardContent className="p-4">
                {editingId === svc.id ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input className="flex-1" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
                    <Input className="w-28" type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: parseInt(e.target.value) || 0 })} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateService(svc.id)} disabled={isSaving}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      <span className="font-medium">{svc.service_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />{svc.fee}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(svc.id); setForm({ serviceName: svc.service_name, fee: svc.fee }); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteService(svc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
