import { AlertCircle } from "lucide-react";

const Box = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted/60 rounded ${className}`} />
);

export function ProductCardSkeleton() {
  return (
    <div className="bg-background p-4">
      <Box className="aspect-[4/3] w-full rounded-xl" />
      <Box className="h-4 w-3/4 mt-3" />
      <Box className="h-3 w-1/2 mt-2" />
      <div className="flex items-center justify-between mt-3">
        <Box className="h-5 w-16" />
        <Box className="h-7 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border rounded-2xl overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Box className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5">
        <Box className="h-4 w-3/4" />
        <Box className="h-3 w-1/2 mt-2" />
        <div className="mt-3 flex items-center justify-between">
          <Box className="h-5 w-16" />
          <Box className="h-7 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function FarmCardSkeleton() {
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-background border border-border">
      <Box className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5">
        <Box className="h-5 w-2/3" />
        <Box className="h-3 w-1/3 mt-2" />
        <Box className="h-3 w-full mt-4" />
        <Box className="h-3 w-5/6 mt-2" />
        <Box className="h-3 w-4/6 mt-2" />
        <Box className="h-9 w-28 mt-5 rounded-full" />
      </div>
    </article>
  );
}

export function TabListSkeleton() {
  return (
    <div>
      <Box className="h-5 w-24 mb-4" />
      <ul className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex gap-3">
            <Box className="h-16 w-16 rounded-xl shrink-0" />
            <div className="flex-1">
              <Box className="h-4 w-3/4" />
              <Box className="h-3 w-1/2 mt-2" />
              <Box className="h-3 w-1/3 mt-2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionError({
  message = "Couldn't load this section.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
      <p className="text-sm text-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
