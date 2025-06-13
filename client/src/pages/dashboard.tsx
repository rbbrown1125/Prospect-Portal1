import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import StatsGrid from "@/components/stats-grid";
import RecentSites from "@/components/recent-sites";
import QuickActions from "@/components/quick-actions";
import TemplatesSection from "@/components/templates-section";
import CreateSiteModal from "@/components/create-site-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Menu, Globe, User, ExternalLink, Eye, Calendar } from "lucide-react";

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: mySites, isLoading: mySitesLoading } = useQuery({
    queryKey: ['/api/sites/my'],
  });

  const { data: teamSites, isLoading: teamSitesLoading } = useQuery({
    queryKey: ['/api/sites/team'],
  });

  const handleKpiClick = (kpiType: string) => {
    setSelectedKpi(kpiType);
  };

  const renderKpiDetails = (kpiType: string) => {
    switch (kpiType) {
      case 'active-sites':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Active Sites Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{mySites?.length || 0}</div>
                <div className="text-sm text-blue-800">My Sites</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{teamSites?.length || 0}</div>
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
            <StatsGrid stats={stats} isLoading={statsLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <RecentSites />
              </div>
              <div>
                <QuickActions onCreateSite={() => setIsCreateModalOpen(true)} />
              </div>
            </div>

            <TemplatesSection onSelectTemplate={() => setIsCreateModalOpen(true)} />
          </div>
        </div>
      </main>

      <CreateSiteModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
