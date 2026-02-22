import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Users, Calendar, IndianRupee, Star } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  clinicId: string;
  clinicFees: number;
  clinicRating: number | null;
}

interface DayData {
  date: string;
  label: string;
  count: number;
}

export function ClinicAnalytics({ clinicId, clinicFees, clinicRating }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [clinicId]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all appointments for this clinic
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('date, status')
        .eq('clinic_id', clinicId);
      if (error) throw error;

      const all = appointments || [];
      setTotalAppointments(all.length);
      setConfirmedCount(all.filter(a => a.status === 'confirmed').length);
      setCancelledCount(all.filter(a => a.status === 'cancelled').length);
      setPendingCount(all.filter(a => a.status === 'pending').length);

      // Last 14 days trend
      const days: DayData[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, 'yyyy-MM-dd');
        days.push({
          date: dateStr,
          label: format(d, 'MMM d'),
          count: all.filter(a => a.date === dateStr).length,
        });
      }
      setDailyData(days);

      // Review count
      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);
      setReviewCount(count || 0);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const estimatedRevenue = confirmedCount * clinicFees;

  const statusData = [
    { name: 'Confirmed', value: confirmedCount, color: 'hsl(var(--success))' },
    { name: 'Pending', value: pendingCount, color: 'hsl(var(--warning))' },
    { name: 'Cancelled', value: cancelledCount, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Total Appointments" value={totalAppointments} color="primary" />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Est. Revenue" value={`₹${estimatedRevenue.toLocaleString()}`} color="success" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Avg Rating" value={clinicRating ? Number(clinicRating).toFixed(1) : 'N/A'} color="warning" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Reviews" value={reviewCount} color="info" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Appointments (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    success: 'bg-success/10 text-success',
  };
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
