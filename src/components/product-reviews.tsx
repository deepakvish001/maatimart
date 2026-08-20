import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("id,rating,comment,created_at,user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: canReview } = useQuery({
    queryKey: ["can-review", productId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,status,order_items!inner(product_id)")
        .eq("consumer_id", user!.id)
        .eq("status", "delivered")
        .eq("order_items.product_id", productId)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const mine = reviews?.find((r) => r.user_id === user?.id);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("product_reviews")
      .upsert(
        { product_id: productId, user_id: user.id, rating, comment },
        { onConflict: "product_id,user_id" },
      );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review posted");
    setComment("");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
    qc.invalidateQueries({ queryKey: ["product", productId] });
  };

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="font-display text-2xl mb-6">Reviews</h2>

      {canReview && (
        <div className="bg-card p-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            {mine ? "Update your review" : "Leave a review"}
          </p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} type="button">
                <Star
                  size={20}
                  className={i <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how it was…"
            rows={3}
            className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            onClick={submit}
            disabled={submitting}
            className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? "Posting…" : mine ? "Update review" : "Post review"}
          </Button>
        </div>
      )}

      {(reviews?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet — be the first after your delivery arrives.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews!.map((r) => (
            <li key={r.id} className="bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <StarRating value={r.rating} />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-foreground/90">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
