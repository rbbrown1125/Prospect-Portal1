import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
              <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-12 animate-pulse mb-2" />
              <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sites Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SitesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-slate-200 rounded w-24 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 bg-slate-200 rounded w-40 animate-pulse mb-2" />
              <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-28 animate-pulse" />
                <div className="flex justify-between items-center mt-4">
                  <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                  <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {/* Header */}
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`header-${i}`} className="h-4 bg-slate-200 rounded animate-pulse" />
        ))}
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={`row-${rowIndex}-col-${colIndex}`}
              className="h-4 bg-slate-200 rounded animate-pulse"
            />
          ))
        )}
      </div>
    </div>
  );
}