import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import StatsGrid from "@/components/stats-grid";
import RecentSites from "@/components/recent-sites";
import QuickActions from "@/components/quick-actions";
import TemplatesSection from "@/components/templates-section";
import CreateSiteModal from "@/components/create-site-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage your sales content and prospect sites</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Site</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <StatsGrid stats={stats} isLoading={statsLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
