type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-xl ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-3">
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="flex justify-between items-center">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/4 h-4" />
      </div>
      <Skeleton className="w-3/4 h-5" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-5 rounded-md" />
        <Skeleton className="w-16 h-5 rounded-md" />
      </div>
      <div className="pt-2 flex justify-between items-center border-t border-gray-50">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
