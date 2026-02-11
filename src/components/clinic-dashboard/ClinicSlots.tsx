import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { TimeSlot } from '@/types';

interface Props {
  clinicId: string;
  slots: TimeSlot[];
  selectedDate: string;
  onUpdate: () => void;
}

export function ClinicSlots({ clinicId, slots, selectedDate, onUpdate }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [form, setForm] = useState({ startTime: '09:00', endTime: '09:30' });
  const [bulkForm, setBulkForm] = useState({ startTime: '09:00', endTime: '17:00', duration: 30 });

  const createSlot = async () => {
    if (!form.startTime || !form.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    setIsCreating(true);
    try {
      // Check overlap
      const overlap = slots.some(s =>
        (form.startTime >= s.start_time && form.startTime < s.end_time) ||
        (form.endTime > s.start_time && form.endTime <= s.end_time)
      );
      if (overlap) {
        toast.error('This slot overlaps with an existing slot');
        return;
      }

      const { error } = await supabase.from('time_slots').insert({
        clinic_id: clinicId,
        date: selectedDate,
        start_time: form.startTime,
        end_time: form.endTime,
        is_available: true,
      });
      if (error) throw error;
      toast.success('Slot created');
      setDialogOpen(false);
      onUpdate();
    } catch {
      toast.error('Failed to create slot');
    } finally {
      setIsCreating(false);
    }
  };

  const createBulkSlots = async () => {
    if (bulkForm.startTime >= bulkForm.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    setIsCreating(true);
    try {
      const slotsToCreate: { clinic_id: string; date: string; start_time: string; end_time: string; is_available: boolean }[] = [];
      let current = bulkForm.startTime;

      while (current < bulkForm.endTime) {
        const [h, m] = current.split(':').map(Number);
        const totalMin = h * 60 + m + bulkForm.duration;
        const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
        const endM = (totalMin % 60).toString().padStart(2, '0');
        const end = `${endH}:${endM}`;

        if (end > bulkForm.endTime) break;

        const overlap = slots.some(s =>
          (current >= s.start_time && current < s.end_time) ||
          (end > s.start_time && end <= s.end_time)
        );
        if (!overlap) {
          slotsToCreate.push({
            clinic_id: clinicId,
            date: selectedDate,
            start_time: current,
            end_time: end,
            is_available: true,
          });
        }
        current = end;
      }

      if (slotsToCreate.length === 0) {
        toast.error('No valid slots to create (all overlap with existing)');
        return;
      }

      const { error } = await supabase.from('time_slots').insert(slotsToCreate);
      if (error) throw error;
      toast.success(`${slotsToCreate.length} slots created`);
      setDialogOpen(false);
      onUpdate();
    } catch {
      toast.error('Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slotId);
      if (error) throw error;
      toast.success('Slot deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete slot');
    }
  };

  const available = slots.filter(s => s.is_available);
  const booked = slots.filter(s => !s.is_available);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {available.length} available · {booked.length} booked
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Slots
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Time Slots</DialogTitle>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              <Button
                variant={!bulkMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBulkMode(false)}
              >
                Single Slot
              </Button>
              <Button
                variant={bulkMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBulkMode(true)}
              >
                Bulk Generate
              </Button>
            </div>

            {!bulkMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start</label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End</label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full" onClick={createSlot} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Slot'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Hour</label>
                    <Input type="time" value={bulkForm.startTime} onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Hour</label>
                    <Input type="time" value={bulkForm.endTime} onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Slot Duration (minutes)</label>
                  <Input
                    type="number"
                    min={10}
                    max={120}
                    value={bulkForm.duration}
                    onChange={(e) => setBulkForm({ ...bulkForm, duration: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <Button className="w-full" onClick={createBulkSlots} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Slots'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {slots.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No slots for this date</p>
            <p className="text-sm mt-1">Add slots so patients can book appointments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot) => (
            <Card key={slot.id} className={!slot.is_available ? 'opacity-60' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {slot.start_time.slice(0, 5)}
                  </span>
                  {slot.is_available ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSlot(slot.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  ) : (
                    <Badge variant="confirmed" className="text-[10px] px-1.5 py-0">Booked</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{slot.end_time.slice(0, 5)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
