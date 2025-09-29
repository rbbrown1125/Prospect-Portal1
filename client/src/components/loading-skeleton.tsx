import { Skeleton } from "@/components/ui/skeleton";

export function SiteCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-end space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}