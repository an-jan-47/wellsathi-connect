import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, MessageSquare, Verified, ChevronDown, CheckCircle2, Send, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  clinicId: string;
  showForm?: boolean;
  appointmentId?: string;
  onReviewSubmitted?: () => void;
}

const getAvatarColor = (name: string) => {
  const COLORS = ['bg-primary/10 text-primary', 'bg-primarylue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

export function ClinicReviews({ clinicId }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isClinicOwner = user?.role === 'clinic' && user?.id === clinicId;
  const [activeFilter, setActiveFilter] = useState('All Reviews');
  const [sortBy, setSortBy] = useState('Newest First');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['review_stats', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_clinic_review_stats', { p_clinic_id: clinicId });
      if (error) throw error;
      const rows = data as any[] | null;
      return rows?.[0] || { total_reviews: 0, average_rating: 0, positive_sentiment_percent: 0, response_rate_percent: 0 };
    },
    enabled: !!clinicId,
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['clinic_reviews', clinicId, activeFilter, sortBy],
    queryFn: async () => {
      let q = supabase.from('reviews').select('*, profiles:user_id(name)').eq('clinic_id', clinicId);

      if (activeFilter === '5 Stars') q = q.eq('rating', 5);
      else if (activeFilter === '4 Stars') q = q.eq('rating', 4);
      else if (activeFilter === '3 Stars') q = q.eq('rating', 3);
      else if (activeFilter === 'Critical') q = q.in('rating', [1, 2]);

      if (sortBy === 'Newest First') q = q.order('created_at', { ascending: false });
      else if (sortBy === 'Oldest First') q = q.order('created_at', { ascending: true });
      else if (sortBy === 'Highest Rating') q = q.order('rating', { ascending: false });
      else if (sortBy === 'Lowest Rating') q = q.order('rating', { ascending: true });

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('reviews').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic_reviews', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['review_stats', clinicId] });
    },
    onError: (err: any) => toast.error(err.message || 'Action failed'),
  });

  const handleReplySubmit = (id: string) => {
    if (!replyText.trim()) return toast.error('Response cannot be empty');
    updateMutation.mutate(
      { id, updates: { reply: replyText.trim(), reply_date: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast.success('Reply published successfully');
          setReplyingTo(null);
          setReplyText('');
        },
      }
    );
  };

  const filters = ['All Reviews', '5 Stars', '4 Stars', '3 Stars', 'Critical'];
  const sorts = ['Newest First', 'Oldest First', 'Highest Rating', 'Lowest Rating'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="pl-0.5">
        <h2 className="text-[22px] sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">Patient Feedback</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-[13px] sm:text-[14px]">Verified reviews from real patients.</p>
      </div>

      {/* Sentiment Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Clinic Reputation */}
        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-800 rounded-[18px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-5 flex flex-col justify-center min-h-[140px]">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Clinic Reputation</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(Number(stats?.average_rating || 0)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-[36px] font-black text-slate-900 dark:text-white leading-none">
              {Number(stats?.average_rating || 0).toFixed(1)}
              <span className="text-[16px] text-slate-400 dark:text-slate-500 font-bold">/5.0</span>
            </h3>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-500 dark:text-slate-400">i</span>
            Based on {stats?.total_reviews || 0} reviews
          </p>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[18px] border border-blue-100 dark:border-blue-800/30 p-5 flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-4 z-10">
            <div className="w-4 h-4 rounded-full border-[2.5px] border-blue-500 border-t-transparent" style={{ transform: 'rotate(45deg)' }} />
          </div>
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest z-10">Positive Sentiment</span>
          <h3 className="text-[32px] font-black text-slate-900 dark:text-white mt-0.5 z-10">{Number(stats?.positive_sentiment_percent || 0).toFixed(0)}%</h3>
          <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 mt-auto z-10">Aggregate % of 4+ Stars</p>
        </div>

        {/* Response Rate */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-[18px] border border-primary/15 dark:border-primary/20 p-5 flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-4 z-10">
            <MessageSquare className="w-4 h-4 text-primary fill-primary/20" />
          </div>
          <span className="text-[10px] font-extrabold text-primary dark:text-primary uppercase tracking-widest z-10">Response Rate</span>
          <h3 className="text-[32px] font-black text-slate-900 dark:text-white mt-0.5 z-10">{Number(stats?.response_rate_percent || 0).toFixed(0)}%</h3>
          <p className="text-[10px] font-bold text-primary dark:text-primary/80 mt-auto z-10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Reply conversion rate
          </p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sort</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                {sortBy} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 dark:border-slate-700 dark:bg-slate-800">
              {sorts.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSortBy(s)} className={`font-bold py-2 cursor-pointer text-[13px] dark:text-slate-200 ${sortBy === s ? 'text-slate-900 dark:text-white' : 'text-slate-600'}`}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
            <p className="font-bold text-[15px] text-slate-500 dark:text-slate-400">No Reviews Yet</p>
            <p className="text-[13px] mt-1 dark:text-slate-500">Be the first to leave feedback for this clinic.</p>
          </div>
        ) : (
          reviews.map((review: any) => (
            <div
              key={review.id}
              className={`bg-white dark:bg-slate-800 rounded-[20px] shadow-sm dark:shadow-none border ${review.flagged ? 'border-red-200 dark:border-red-800/30 bg-red-50/20 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-700'} p-5 md:p-6 relative transition-colors`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[15px] ${getAvatarColor(review.profiles?.name)}`}>
                    {(review.profiles?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[14px] text-slate-900 dark:text-white">
                      {review.profiles?.name || 'Anonymous Patient'}
                      {review.flagged && (
                        <span className="ml-2 text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Moderated</span>
                      )}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                      <Verified className="w-3 h-3 text-primary" />
                      Verified Patient • {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600'}`} />
                  ))}
                </div>
              </div>

              <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">"{review.comment}"</p>

              {review.reply && (
                <div className="ml-3 md:ml-10 mb-4 bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20 rounded-xl p-4 relative before:absolute before:left-[-1px] before:top-3 before:bottom-3 before:w-[3px] before:bg-primary before:rounded-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Clinic Response
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      {review.reply_date ? format(new Date(review.reply_date), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">"{review.reply}"</p>
                </div>
              )}

              {replyingTo === review.id && (
                <div className="ml-3 md:ml-10 mb-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
                  <textarea
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-[13px] font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none dark:placeholder:text-slate-500"
                    placeholder="Write a clinic response..."
                    value={replyText}
                    autoFocus
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 py-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg">Cancel</button>
                    <button onClick={() => handleReplySubmit(review.id)} disabled={updateMutation.isPending} className="flex items-center gap-1.5 px-5 py-1.5 bg-[#006b5f] hover:bg-[#005048] text-white font-bold text-[12px] rounded-lg shadow-sm">
                      <Send className="w-3 h-3" /> Publish
                    </button>
                  </div>
                </div>
              )}

              {isClinicOwner && (
                <div className="flex justify-end items-center mt-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-2">
                    {!review.reply && replyingTo !== review.id && (
                      <button onClick={() => { setReplyingTo(review.id); setReplyText(''); }} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white font-bold text-[12px] rounded-lg shadow-sm transition-all">
                        + Reply
                      </button>
                    )}
                    {review.reply && replyingTo !== review.id && (
                      <button onClick={() => { setReplyingTo(review.id); setReplyText(review.reply); }} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[12px] rounded-lg shadow-sm transition-all">
                        <Edit2 className="w-3 h-3" /> Edit Reply
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
