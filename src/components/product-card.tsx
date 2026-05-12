import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Plus, Leaf } from "lucide-react";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-store";
import { StarRating } from "@/components/star-rating";
import { useCart, cartTotal } from "@/lib/cart-store";
import { getDeliveryEta } from "@/lib/delivery-eta";
import { EtaChip } from "@/components/eta-chip";
import { usePincode } from "@/lib/pincode-store";

export interface ProductCardData {
  id: string;
  name: string;
  unit: string;
  price_paise: number;
  image_url: string | null;
  is_organic: boolean;
  stock?: number | null;
  rating_avg?: number;
  rating_count?: number;
  farm?: { name: string; region: string; delivery_pincodes?: string[] | null } | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const img = resolveImage(p.image_url);
  const { has, toggle, ready } = useWishlist();
  const navigate = useNavigate();
  const saved = has(p.id);
  const items = useCart((s) => s.items);
  const { pincode } = usePincode();
  const eta = getDeliveryEta({
    stock: p.stock,
    cartTotalPaise: cartTotal(items),
    addingPaise: p.price_paise,
    userPincode: pincode,
    farmPincodes: p.farm?.delivery_pincodes ?? null,
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate({ to: "/product/$id", params: { id: p.id } });
  };

  return (
    <div className="group relative flex flex-col bg-background p-4 transition-all hover:bg-card">
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {p.is_organic && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm">
            <Leaf className="h-3 w-3" /> Organic
          </span>
        )}
      </div>

      {/* Wishlist */}
      {ready && (
        <button
          onClick={(e) => { e.preventDefault(); toggle(p.id); }}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/95 backdrop-blur shadow-sm border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Heart size={16} className={saved ? "fill-primary text-primary" : "text-muted-foreground"} />
        </button>
      )}

      <Link to="/product/$id" params={{ id: p.id }} className="flex flex-col flex-1">
        <div className="mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-muted/60">
          {img ? (
            <img
              src={img}
              alt={p.name}
              loading="lazy"
              width={600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="font-semibold leading-tight line-clamp-2 mb-1">{p.name}</h3>
          {p.farm && (
            <p className="text-xs text-muted-foreground truncate">
              From <span className="text-foreground/80">{p.farm.name}</span> · {p.farm.region}
            </p>
          )}
          {typeof p.rating_count === "number" && p.rating_count > 0 ? (
            <div className="mt-2"><StarRating value={p.rating_avg ?? 0} count={p.rating_count} /></div>
          ) : (
            <div className="mt-2 text-[11px] text-muted-foreground">New listing</div>
          )}

          <div className="mt-3" onClick={(e) => e.preventDefault()}>
            <EtaChip eta={eta} />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-primary leading-none">
                {formatINR(p.price_paise)}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">per {p.unit}</span>
            </div>
            <button
              onClick={handleAdd}
              aria-label={`Add ${p.name} to cart`}
              className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-transform"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
