import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FLOW = ["placed", "shipped", "delivered"] as const;

export function OrderTimeline({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const { data } = useQuery({
    queryKey: ["order-events", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_status_events")
        .select("status,note,created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const reached = (s: string) => {
    const flow: readonly string[] = FLOW;
    const i = flow.indexOf(s);
    const c = flow.indexOf(currentStatus);
    return i >= 0 && c >= i;
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        {FLOW.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={`h-2 w-2 rounded-full ${reached(s) ? "bg-accent" : "bg-muted-foreground/30"}`}
            />
            <span
              className={`font-mono text-[10px] uppercase tracking-widest ml-2 ${reached(s) ? "text-accent" : "text-muted-foreground"}`}
            >
              {s}
            </span>
            {i < FLOW.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 ${reached(FLOW[i + 1]) ? "bg-accent" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>
      {data && data.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {data.map((e, idx) => (
            <li key={idx} className="font-mono">
              · {new Date(e.created_at).toLocaleString("en-IN")} — {e.status}
              {e.note ? ` (${e.note})` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
