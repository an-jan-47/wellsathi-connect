import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Phone, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { Appointment } from '@/types';

interface Props {
  appointments: Appointment[];
  onUpdate: () => void;
}

export function ClinicAppointments({ appointments, onUpdate }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Appointment ${status}`);
      onUpdate();
    } catch {
      toast.error('Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (appointments.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No appointments for this date</p>
          <p className="text-sm mt-1">Appointments will appear here when patients book slots</p>
        </CardContent>
      </Card>
    );
  }

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const renderGroup = (title: string, items: Appointment[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title} ({items.length})
        </h3>
        {items.map((apt) => (
          <Card key={apt.id} variant="elevated">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{apt.patient_name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {apt.patient_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {apt.time.slice(0, 5)}
                    </span>
                  </div>
                  {apt.notes && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {apt.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      apt.status === 'confirmed' ? 'confirmed' :
                      apt.status === 'cancelled' ? 'cancelled' : 'pending'
                    }
                  >
                    {apt.status}
                  </Badge>

                  {apt.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-success border-success/30 hover:bg-success/10"
                        onClick={() => updateStatus(apt.id, 'confirmed')}
                        disabled={updatingId === apt.id}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => updateStatus(apt.id, 'cancelled')}
                        disabled={updatingId === apt.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderGroup('Pending', pending)}
      {renderGroup('Confirmed', confirmed)}
      {renderGroup('Cancelled', cancelled)}
    </div>
  );
}
