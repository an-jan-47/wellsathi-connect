import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, MapPin, Phone as PhoneIcon, IndianRupee, Building2 } from 'lucide-react';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
  onUpdate: (clinic: Clinic) => void;
}

export function ClinicProfileEditor({ clinic, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: clinic.name,
    address: clinic.address,
    city: clinic.city,
    phone: clinic.phone || '',
    fees: clinic.fees,
    description: clinic.description || '',
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Name, address and city are required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          phone: form.phone.trim() || null,
          fees: form.fees,
          description: form.description.trim() || null,
        })
        .eq('id', clinic.id);

      if (error) throw error;

      onUpdate({
        ...clinic,
        ...form,
        phone: form.phone || null,
        description: form.description || null,
      });
      toast.success('Profile updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Clinic Profile</CardTitle>
            <CardDescription>Your clinic information visible to patients</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Building2 className="h-4 w-4" />} label="Clinic Name" value={clinic.name} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="City" value={clinic.city} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={clinic.address} />
            <InfoItem icon={<IndianRupee className="h-4 w-4" />} label="Consultation Fee" value={`₹${clinic.fees}`} />
            <InfoItem icon={<PhoneIcon className="h-4 w-4" />} label="Phone" value={clinic.phone || '—'} />
          </div>
          {clinic.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
              <p className="text-foreground">{clinic.description}</p>
            </div>
          )}
          {clinic.specializations && clinic.specializations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {clinic.specializations.map((s) => (
                  <Badge key={s} variant="accent">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your clinic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Clinic Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">City *</label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Address *</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Consultation Fee (₹)</label>
            <Input type="number" min={0} value={form.fees} onChange={(e) => setForm({ ...form, fees: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <label className="text-sm text-muted-foreground">{label}</label>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
