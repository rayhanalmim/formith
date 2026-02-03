import { Skeleton } from '@/components/ui/skeleton';

export function PostSkeleton() {
  return (
    <article className="glass-card p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Image placeholder (optional) */}
      <Skeleton className="h-48 w-full rounded-xl mb-3" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </article>
  );
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
