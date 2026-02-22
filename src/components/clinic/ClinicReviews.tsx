import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Review } from '@/types';

interface Props {
  clinicId: string;
  showForm?: boolean;
  appointmentId?: string;
  onReviewSubmitted?: () => void;
}

export function ClinicReviews({ clinicId, showForm = false, appointmentId, onReviewSubmitted }: Props) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [clinicId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      
      // Fetch profile names for reviewers
      const reviews = data || [];
      if (reviews.length > 0) {
        const userIds = [...new Set(reviews.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const enriched = reviews.map(r => ({
          ...r,
          profiles: { name: profileMap.get(r.user_id) || 'Anonymous' },
        }));
        setReviews(enriched as Review[]);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        clinic_id: clinicId,
        user_id: user.id,
        appointment_id: appointmentId || null,
        rating,
        comment: comment.trim() || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this appointment');
        } else throw error;
        return;
      }
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      fetchReviews();
      onReviewSubmitted?.();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-warning fill-warning" />
            <span className="text-2xl font-bold">{avgRating}</span>
          </div>
          <span className="text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
        </div>
      )}

      {/* Review Form */}
      {showForm && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= (hoverRating || rating)
                          ? 'text-warning fill-warning'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <Button onClick={submitReview} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {(review.profiles as any)?.name || 'Anonymous'}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'text-warning fill-warning' : 'text-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
