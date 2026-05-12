import { Star } from "lucide-react";

export function StarRating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= rounded ? "fill-accent text-accent" : "text-muted-foreground/40"}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="font-mono text-[10px] text-muted-foreground">
          {value.toFixed(1)} · {count}
        </span>
      )}
    </div>
  );
}
