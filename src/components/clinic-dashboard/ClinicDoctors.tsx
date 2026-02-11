import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, User, Loader2, X, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { Doctor } from '@/types';

interface Props {
  clinicId: string;
}

export function ClinicDoctors({ clinicId }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', specialization: '', bio: '' });

  useEffect(() => {
    fetchDoctors();
  }, [clinicId]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');
      if (error) throw error;
      setDoctors(data as Doctor[] || []);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const createDoctor = async () => {
    if (!form.name.trim() || !form.specialization.trim()) {
      toast.error('Name and specialization are required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('doctors').insert({
        clinic_id: clinicId,
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        bio: form.bio.trim() || null,
      });
      if (error) throw error;
      toast.success('Doctor added');
      setForm({ name: '', specialization: '', bio: '' });
      setDialogOpen(false);
      fetchDoctors();
    } catch {
      toast.error('Failed to add doctor');
    } finally {
      setIsSaving(false);
    }
  };

  const updateDoctor = async (id: string) => {
    if (!form.name.trim() || !form.specialization.trim()) {
      toast.error('Name and specialization are required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('doctors').update({
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        bio: form.bio.trim() || null,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Doctor updated');
      setEditingId(null);
      fetchDoctors();
    } catch {
      toast.error('Failed to update doctor');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      toast.success('Doctor removed');
      fetchDoctors();
    } catch {
      toast.error('Failed to remove doctor');
    }
  };

  const startEdit = (doc: Doctor) => {
    setEditingId(doc.id);
    setForm({ name: doc.name, specialization: doc.specialization, bio: doc.bio || '' });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</p>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (o) setForm({ name: '', specialization: '', bio: '' }); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Doctor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Doctor</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-2 block">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" /></div>
              <div><label className="text-sm font-medium mb-2 block">Specialization *</label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiologist" /></div>
              <div><label className="text-sm font-medium mb-2 block">Bio</label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} placeholder="Brief description..." /></div>
              <Button className="w-full" onClick={createDoctor} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Doctor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {doctors.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No doctors added yet</p>
            <p className="text-sm mt-1">Add doctors to your clinic for patients to see</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <Card key={doc.id} variant="elevated">
              <CardContent className="p-5">
                {editingId === doc.id ? (
                  <div className="space-y-3">
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                    <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Specialization" />
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} placeholder="Bio" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateDoctor(doc.id)} disabled={isSaving}>
                        <Check className="h-4 w-4 mr-1" />{isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">{doc.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{doc.name}</p>
                        <p className="text-sm text-primary">{doc.specialization}</p>
                        {doc.bio && <p className="text-sm text-muted-foreground mt-1">{doc.bio}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(doc)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteDoctor(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
