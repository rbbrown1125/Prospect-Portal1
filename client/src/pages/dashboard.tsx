import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import StatsGrid from "@/components/stats-grid";
import RecentSites from "@/components/recent-sites";
import QuickActions from "@/components/quick-actions";
import TemplatesSection from "@/components/templates-section";
import CreateSiteModal from "@/components/create-site-modal";
import { DashboardStatsSkeleton, SiteCardSkeleton } from "@/components/loading-skeleton";
import { useDashboardData, type DashboardData } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Menu, Globe, User, ExternalLink, Eye, Calendar, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Use optimized dashboard data hook
  const { data: dashboardData, isLoading, error } = useDashboardData();
  
  // Extract data for backward compatibility with safe defaults
  const stats = dashboardData?.stats || { totalSites: 0, totalViews: 0, activeSites: 0, recentViews: 0 };
  const mySites = dashboardData?.mySites || [];
  const teamSites = dashboardData?.teamSites || [];



  const handleKpiClick = (kpiType: string) => {
    setSelectedKpi(kpiType);
  };

  // Error boundary for graceful error handling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h2 className="font-semibold">Unable to Load Dashboard</h2>
            </div>
            <p className="text-slate-600 mb-4">
              There was a problem loading your dashboard data. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Loading your workspace...</p>
            </div>
            <DashboardStatsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <SiteCardSkeleton />
                  <SiteCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderKpiDetails = (kpiType: string) => {
    const mySitesCount = Array.isArray(mySites) ? mySites.length : 0;
    const teamSitesCount = Array.isArray(teamSites) ? teamSites.length : 0;
    
    switch (kpiType) {
      case 'active-sites':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Active Sites Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{mySitesCount}</div>
                <div className="text-sm text-blue-800">My Sites</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{teamSitesCount}</div>
                <div className="text-sm text-green-800">Team Sites</div>
              </div>
            </div>
          </div>
        );
      case 'total-views':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Views Analytics</h3>
            <div className="text-sm text-slate-600">
              Total page views across all your sites and team sites.
            </div>
            <Button onClick={() => setLocation('/analytics')} className="w-full">
              View Detailed Analytics
            </Button>
          </div>
        );
      case 'active-prospects':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Prospect Engagement</h3>
            <div className="text-sm text-slate-600">
              Number of prospects actively engaging with your sites.
            </div>
            <Button onClick={() => setLocation('/prospects')} className="w-full">
              Manage Prospects
            </Button>
          </div>
        );
      case 'conversion-rate':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Engagement Metrics</h3>
            <div className="text-sm text-slate-600">
              Rate at which prospects interact with your content.
            </div>
            <Button onClick={() => setLocation('/analytics')} className="w-full">
              View Conversion Details
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-200 ease-in-out
      `}>
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1 text-sm lg:text-base">Manage your sales content and prospect sites</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create New Site</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            <StatsGrid stats={stats} isLoading={false} onKpiClick={handleKpiClick} />
            
            {/* Sites Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sites Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="my-sites" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="my-sites">
                      My Sites ({Array.isArray(mySites) ? mySites.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="team-sites">
                      Team Sites ({Array.isArray(teamSites) ? teamSites.length : 0})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="my-sites" className="space-y-4">
                    {Array.isArray(mySites) && mySites.length > 0 ? (
                      <div className="grid gap-4">
                        {mySites.slice(0, 5).map((site: any) => (
                          <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium">{site.name}</h3>
                                <Badge variant={site.isActive ? "default" : "secondary"}>
                                  {site.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                For {site.prospectName} • {site.views || 0} views
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setLocation(`/sites/${site.id}/edit`)}>
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => window.open(`/site/${site.id}`, '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No sites created yet</p>
                        <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                          Create Your First Site
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="team-sites" className="space-y-4">
                    {Array.isArray(teamSites) && teamSites.length > 0 ? (
                      <div className="grid gap-4">
                        {teamSites.slice(0, 5).map((item: any) => (
                          <div key={item.site.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium">{item.site.name}</h3>
                                <Badge variant={item.site.isActive ? "default" : "secondary"}>
                                  {item.site.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  Created by {item.owner?.firstName || item.owner?.email || 'Unknown'}
                                </div>
                                <div>For {item.site.prospectName} • {item.site.views || 0} views</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => window.open(`/site/${item.site.id}`, '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No team sites available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <TemplatesSection onSelectTemplate={() => setIsCreateModalOpen(true)} />
              </div>
              <div>
                <QuickActions onCreateSite={() => setIsCreateModalOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreateSiteModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <Dialog open={!!selectedKpi} onOpenChange={() => setSelectedKpi(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analytics Details</DialogTitle>
          </DialogHeader>
          {selectedKpi && renderKpiDetails(selectedKpi)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
