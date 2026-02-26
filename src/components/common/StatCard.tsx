import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const colorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'primary' | 'success' | 'info' | 'warning';
}

/**
 * Shared stat card component used in both AdminDashboard and ClinicDashboard.
 */
export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
