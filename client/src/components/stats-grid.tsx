import { Card, CardContent } from "@/components/ui/card";
import { Globe, Eye, Users, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface StatsGridProps {
  stats?: any;
  isLoading: boolean;
  onKpiClick?: (kpiType: string) => void;
}

export default function StatsGrid({ stats, isLoading, onKpiClick }: StatsGridProps) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 lg:h-4 bg-slate-200 rounded w-16 lg:w-20"></div>
                  <div className="h-6 lg:h-8 bg-slate-200 rounded w-12 lg:w-16"></div>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="mt-3 lg:mt-4 h-2 lg:h-3 bg-slate-200 rounded w-16 lg:w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultStats = {
    activeSites: 0,
    totalViews: 0,
    activeProspects: 0,
    engagementRate: 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onKpiClick ? onKpiClick('active-sites') : setLocation('/sites')}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs lg:text-sm font-medium">Active Sites</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1 lg:mt-2">
                {displayStats.activeSites}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Globe className="text-primary h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-success font-medium">+2</span>
            <span className="text-slate-600 ml-1">this month</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onKpiClick ? onKpiClick('total-views') : setLocation('/analytics')}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs lg:text-sm font-medium">Total Views</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1 lg:mt-2">
                {displayStats.totalViews?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <Eye className="text-success h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-success font-medium">+18%</span>
            <span className="text-slate-600 ml-1">vs last week</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onKpiClick ? onKpiClick('active-prospects') : setLocation('/prospects')}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs lg:text-sm font-medium">Active Prospects</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1 lg:mt-2">
                {displayStats.activeProspects}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="text-purple-600 h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-success font-medium">+5</span>
            <span className="text-slate-600 ml-1">new this week</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onKpiClick ? onKpiClick('conversion-rate') : setLocation('/analytics')}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs lg:text-sm font-medium">Engagement Rate</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1 lg:mt-2">
                {displayStats.engagementRate}%
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-orange-600 h-4 w-4 lg:h-6 lg:w-6" />
            </div>
          </div>
          <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
            <span className="text-success font-medium">+12%</span>
            <span className="text-slate-600 ml-1">improvement</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
