import { useQuery } from "@tanstack/react-query";

// Type definitions for better TypeScript support
interface DashboardStats {
  totalSites: number;
  totalViews: number;
  activeSites: number;
  recentViews: number;
}

interface Site {
  id: string;
  name: string;
  prospectName: string;
  prospectEmail: string;
  prospectCompany?: string;
  isActive: boolean;
  views: number;
  createdAt: string;
}

interface TeamSiteItem {
  site: Site;
  owner: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  mySites: Site[];
  teamSites: TeamSiteItem[];
}

// Custom hook for optimized dashboard data loading
export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['/api/dashboard/data'],
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fallback hooks for backward compatibility
export function useDashboardStats() {
  return useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 30000,
  });
}

export function useMySites() {
  return useQuery({
    queryKey: ['/api/sites/my'],
    staleTime: 30000,
  });
}

export function useTeamSites() {
  return useQuery({
    queryKey: ['/api/sites/team'],
    staleTime: 30000,
  });
}