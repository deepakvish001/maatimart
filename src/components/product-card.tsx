import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-store";
import { StarRating } from "@/components/star-rating";

export interface ProductCardData {
  id: string;
  name: string;
  unit: string;
  price_paise: number;
  image_url: string | null;
  is_organic: boolean;
  rating_avg?: number;
  rating_count?: number;
  farm?: { name: string; region: string } | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const img = resolveImage(p.image_url);
  const { has, toggle, ready } = useWishlist();
  const saved = has(p.id);

  return (
    <div className="group relative flex flex-col bg-card p-5 transition-colors hover:bg-card/60">
      {ready && (
        <button
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
        >
          <Heart size={16} className={saved ? "fill-primary text-primary" : "text-muted-foreground"} />
        </button>
      )}
      <Link to="/product/$id" params={{ id: p.id }} className="flex flex-col flex-1">
        <div className="mb-5 aspect-square w-full overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt={p.name}
              loading="lazy"
              width={600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight">{p.name}</h3>
          {p.is_organic && (
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-1.5 py-0.5">
              Organic
            </span>
          )}
        </div>
        {p.farm && (
          <p className="text-xs text-muted-foreground">{p.farm.name} · {p.farm.region}</p>
        )}
        {typeof p.rating_count === "number" && p.rating_count > 0 && (
          <div className="mt-2"><StarRating value={p.rating_avg ?? 0} count={p.rating_count} /></div>
        )}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <span className="font-mono font-semibold text-accent">
            {formatINR(p.price_paise)}<span className="text-[10px] font-normal text-muted-foreground"> / {p.unit}</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-primary/30 group-hover:border-primary">View</span>
        </div>
      </Link>
    </div>
  );
}
