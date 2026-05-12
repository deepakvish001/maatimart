import { Link, type LinkProps } from "@tanstack/react-router";
import { trackFarmVisit, type VisitSource } from "@/lib/farm-visits";

type Props = {
  farmId: string;
  source: VisitSource;
  className?: string;
  children: React.ReactNode;
} & Omit<LinkProps, "to" | "params" | "onClick">;

/**
 * Drop-in replacement for the static "Visit farm" Link. Logs the click in
 * Supabase (non-blocking) and uses a smooth view-transition for the
 * navigation when the browser supports it.
 */
export function VisitFarmLink({ farmId, source, className, children, ...rest }: Props) {
  return (
    <Link
      to="/farm/$id"
      params={{ id: farmId }}
      viewTransition
      preload="intent"
      onClick={() => {
        // Fire-and-forget: never await, never block navigation.
        void trackFarmVisit(farmId, source);
      }}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
