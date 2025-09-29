import { useQuery } from '@tanstack/react-query';
import { withCache } from '@/lib/cache-manager';

export interface DashboardData {
  stats: {
    totalSites: number;
    activeSites: number;
    totalViews: number;
    totalProspects: number;
    activeProspects: number;
    engagementRate: number;
    recentViews: number;
  };
  mySites: any[];
  teamSites: any[];
  recentActivity: Array<{
    siteName: string;
    viewedAt: Date;
  }>;
  templateCount: number;
}

// Optimized dashboard data hook that fetches all data in one request
export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['/api/dashboard/data'],
    queryFn: withCache(
      async () => {
        const response = await fetch('/api/dashboard/data');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return response.json();
      },
      'dashboard-data',
      60000 // Cache for 1 minute
    ),
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
  });
}