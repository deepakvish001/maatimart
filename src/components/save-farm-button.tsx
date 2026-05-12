import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useFarmWishlist } from "@/lib/farm-wishlist-store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SaveFarmButton({
  farmId,
  className,
  size = "md",
}: {
  farmId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { user } = useAuth();
  const { has, toggle } = useFarmWishlist();
  const navigate = useNavigate();
  const saved = has(farmId);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      aria-label={saved ? "Remove farm from saved" : "Save farm"}
      aria-pressed={saved}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          navigate({ to: "/login", search: { redirect: "/wishlist" } as any });
          return;
        }
        const nowSaved = await toggle(farmId);
        toast.success(nowSaved ? "Farm saved" : "Removed from saved farms");
      }}
      className={cn(
        "grid place-items-center rounded-full bg-background/95 backdrop-blur shadow-sm border border-border hover:border-primary/50 transition-colors",
        dim,
        saved && "text-primary border-primary/40",
        className,
      )}
    >
      <Heart className={cn(icon, saved && "fill-primary")} />
    </button>
  );
}
