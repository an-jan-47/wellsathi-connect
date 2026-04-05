import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, MessageSquare, Verified, Flag, ChevronDown, CheckCircle2, Send, X, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  const COLORS = ['bg-emerald-100 text-emerald-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600'];
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

  // Analytics Widget Fetch
  const { data: stats } = useQuery({
     queryKey: ['review_stats', clinicId],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_clinic_review_stats', { p_clinic_id: clinicId });
       if (error) throw error;
       const rows = data as any[] | null;
       return rows?.[0] || { total_reviews: 0, average_rating: 0, positive_sentiment_percent: 0, response_rate_percent: 0 };
     },
     enabled: !!clinicId
  });

  // Exact Matches query
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
    enabled: !!clinicId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
       const { error } = await supabase.from('reviews').update(updates).eq('id', id);
       if (error) throw error;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['clinic_reviews', clinicId] });
       queryClient.invalidateQueries({ queryKey: ['review_stats', clinicId] });
    },
    onError: (err: any) => toast.error(err.message || 'Action forcefully rejected')
  });

  const handleReplySubmit = (id: string) => {
    if (!replyText.trim()) return toast.error('Response cannot be entirely empty');
    updateMutation.mutate({ 
       id, 
       updates: { reply: replyText.trim(), reply_date: new Date().toISOString() } 
    }, {
       onSuccess: () => {
          toast.success('Reply permanently anchored to patient thread');
          setReplyingTo(null);
          setReplyText('');
       }
    });
  };

  const toggleFlag = (id: string, currentFlag: boolean) => {
    updateMutation.mutate({ id, updates: { flagged: !currentFlag } }, {
       onSuccess: () => toast.success(!currentFlag ? 'Review heavily locked requiring moderation' : 'Flag entirely removed')
    });
  };

  const filters = ['All Reviews', '5 Stars', '4 Stars', '3 Stars', 'Critical'];
  const sorts = ['Newest First', 'Oldest First', 'Highest Rating', 'Lowest Rating'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-8 pl-1">
        <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Patient Feedback</h2>
        <p className="text-slate-500 mt-2 font-medium text-[15px]">Monitor and seamlessly dictate replies natively binding into verified patient threads.</p>
      </div>

      {/* Top Sentiment Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clinic Reputation Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest">Clinic Reputation</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(Number(stats?.average_rating || 0)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[44px] font-black text-slate-900 leading-none">{Number(stats?.average_rating || 0).toFixed(1)}<span className="text-[20px] text-slate-400 font-bold">/5.0</span></h3>
          </div>
          <p className="text-[13px] font-bold text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">i</span>
            Based on {stats?.total_reviews || 0} reviews
          </p>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-[#eff6ff] rounded-[24px] border border-blue-100 p-6 md:p-8 flex flex-col relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 z-10">
             <div className="w-5 h-5 rounded-full border-[3px] border-blue-500 border-t-transparent" style={{ transform: 'rotate(45deg)'}}></div>
          </div>
          <span className="text-[12px] font-extrabold text-blue-600 uppercase tracking-widest z-10">Positive Sentiment</span>
          <h3 className="text-[40px] font-black text-slate-900 mt-1 z-10">{Number(stats?.positive_sentiment_percent || 0).toFixed(0)}%</h3>
          <p className="text-[12px] font-medium text-blue-500 mt-auto z-10 leading-snug max-w-[80%]">Aggregate % of 4+ Stars</p>
          <div className="absolute right-0 bottom-0 flex items-end gap-1 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none p-4">
             <div className="w-6 h-12 bg-blue-900 rounded-t-sm"></div>
             <div className="w-6 h-20 bg-blue-900 rounded-t-sm"></div>
             <div className="w-6 h-32 bg-blue-900 rounded-t-sm"></div>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-[#ebfcf9] rounded-[24px] border border-primary/20 p-6 md:p-8 flex flex-col relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 z-10">
             <MessageSquare className="w-5 h-5 text-primary fill-primary/20" />
          </div>
          <span className="text-[12px] font-extrabold text-[#008a6e] uppercase tracking-widest z-10">Response Rate</span>
          <h3 className="text-[40px] font-black text-slate-900 mt-1 z-10">{Number(stats?.response_rate_percent || 0).toFixed(0)}%</h3>
          <p className="text-[12px] font-bold text-[#00a886] mt-auto z-10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Reply conversion rate
          </p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {filters.map(filter => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Sort By</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="flex items-center gap-2 text-[13px] font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50">
                 {sortBy} <ChevronDown className="w-4 h-4 text-slate-400" />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100">
              {sorts.map(s => (
                <DropdownMenuItem key={s} onClick={() => setSortBy(s)} className={`font-bold py-2 cursor-pointer ${sortBy === s ? 'text-slate-900' : 'text-slate-600'}`}>
                   {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {isLoading ? (
           <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>
        ) : (!reviews || reviews.length === 0) ? (
           <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-16 flex flex-col items-center justify-center text-slate-400">
             <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
             <p className="font-bold text-lg text-slate-500">No Feedback Discovered</p>
             <p className="text-sm mt-1">No reviews currently match this filter query criteria.</p>
           </div>
        ) : reviews.map((review: any) => (
          <div key={review.id} className={`bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border ${review.flagged ? 'border-red-200 bg-red-50/20' : 'border-slate-100'} p-6 md:p-8 relative group transition-colors`}>
            
            {/* Review Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${getAvatarColor(review.profiles?.name)}`}>
                  {(review.profiles?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">
                    {review.profiles?.name || 'Anonymous Patient'}
                    {review.flagged && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Moderated</span>}
                  </h4>
                  <p className="text-[12px] font-bold text-slate-400 mt-0.5">
                    Verified Patient • {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                ))}
              </div>
            </div>

            {/* Review Content */}
            <p className="text-[15px] text-slate-600 leading-relaxed font-medium mb-6">"{review.comment}"</p>

            {/* Clinic Response */}
            {review.reply && (
              <div className="ml-4 md:ml-12 mb-6 bg-[#f8fbfa] border border-primary/20 rounded-2xl p-5 relative before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[3px] before:bg-primary before:rounded-full">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-black text-[#008a6e] uppercase tracking-widest bg-[#e6fffb] px-2.5 py-1 rounded-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Clinic Response
                  </span>
                  <span className="text-[12px] font-bold text-slate-400">{review.reply_date ? format(new Date(review.reply_date), 'MMM d, yyyy p') : ''}</span>
                </div>
                <p className="text-[14px] text-slate-600 leading-relaxed font-medium">"{review.reply}"</p>
              </div>
            )}

            {/* Inline Reply Editor */}
            {replyingTo === review.id && (
               <div className="ml-4 md:ml-12 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                 <textarea 
                   className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50/30 min-h-[100px] resize-none"
                   placeholder="Write an empathetic clinic response..."
                   value={replyText}
                   autoFocus
                   onChange={e => setReplyText(e.target.value)}
                 />
                 <div className="flex justify-end gap-2 mt-3">
                   <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-4 py-2 text-[13px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                   <button onClick={() => handleReplySubmit(review.id)} disabled={updateMutation.isPending} className="flex items-center gap-1.5 px-6 py-2 bg-[#006b5f] hover:bg-[#005048] text-white font-bold text-[13px] rounded-lg shadow-sm">
                     <Send className="w-3.5 h-3.5" /> Publish Reply
                   </button>
                 </div>
               </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5">
                <Verified className="w-4 h-4 text-primary fill-[#e6fffb]" />
                <span className="text-[11px] font-black text-primary uppercase tracking-widest">Secure System</span>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => toggleFlag(review.id, review.flagged)} className={`flex items-center gap-1 text-[13px] font-bold transition-colors ${review.flagged ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}>
                   <Flag className={`w-4 h-4 ${review.flagged ? 'fill-red-500' : ''}`} /> {review.flagged ? 'Flagged' : 'Flag'}
                 </button>
                 {(isClinicOwner && !review.reply && replyingTo !== review.id) && (
                   <button onClick={() => { setReplyingTo(review.id); setReplyText(''); }} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-[13px] rounded-lg shadow-sm transition-all">
                     + Reply
                   </button>
                 )}
                 {(isClinicOwner && review.reply && replyingTo !== review.id) && (
                   <button onClick={() => { setReplyingTo(review.id); setReplyText(review.reply); }} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] rounded-lg shadow-sm transition-all">
                     <Edit2 className="w-3.5 h-3.5" /> Edit Reply
                   </button>
                 )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
