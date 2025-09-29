import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import CreateSiteModal from "@/components/create-site-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteCardSkeleton } from "@/components/loading-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Sites() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [siteToDelete, setSiteToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: sites, isLoading } = useQuery({
    queryKey: ['/api/sites'],
  });

  // Filter sites based on search query with memoization
  const filteredSites = useMemo(() => {
    if (!sites || !debouncedSearchQuery) return sites || [];
    
    const query = debouncedSearchQuery.toLowerCase();
    return sites.filter((site: any) => 
      site.name?.toLowerCase().includes(query) ||
      site.prospectName?.toLowerCase().includes(query) ||
      site.prospectCompany?.toLowerCase().includes(query) ||
      site.prospectEmail?.toLowerCase().includes(query)
    );
  }, [sites, debouncedSearchQuery]);

  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      return apiRequest(`/api/sites/${siteId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      toast({
        title: "Site deleted",
        description: "The site has been successfully deleted.",
      });
      setSiteToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the site. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">My Sites</h1>
                <p className="text-slate-600 mt-1 text-sm lg:text-base">Manage all your prospect sites</p>
              </div>
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
            
            {/* Search bar for better UX */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search sites by name, prospect, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SiteCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredSites && Array.isArray(filteredSites) && filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredSites.map((site: any) => (
                <Card key={site.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base lg:text-lg truncate">{site.name}</CardTitle>
                        <p className="text-xs lg:text-sm text-slate-600 mt-1 truncate">{site.prospectName}</p>
                      </div>
                      <Badge variant={site.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                        {site.isActive ? "Active" : "Draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-slate-600">Views:</span>
                        <span className="font-medium">{site.views || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-slate-600">Last accessed:</span>
                        <span className="font-medium">
                          {site.lastAccessed 
                            ? new Date(site.lastAccessed).toLocaleDateString()
                            : "Never"
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs lg:text-sm"
                          onClick={() => setLocation(`/sites/${site.id}`)}
                        >
                          <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">👁</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs lg:text-sm"
                          onClick={() => setLocation(`/sites/${site.id}/edit`)}
                        >
                          <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">✏️</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={() => setSiteToDelete(site)}
                        >
                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-16 px-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 lg:h-8 lg:w-8 text-slate-400" />
              </div>
              <h3 className="text-base lg:text-lg font-medium text-slate-900 mb-2">No sites yet</h3>
              <p className="text-sm lg:text-base text-slate-600 mb-6">Create your first prospect site to get started.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Your First Site</span>
                <span className="sm:hidden">Create Site</span>
              </Button>
            </div>
          )}
        </div>
      </main>

      <CreateSiteModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <AlertDialog open={!!siteToDelete} onOpenChange={() => setSiteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{siteToDelete?.name}"? This action cannot be undone.
              All site data including analytics will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSiteMutation.mutate(siteToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
