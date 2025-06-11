import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, BarChart3 } from "lucide-react";

export default function RecentSites() {
  const { data: sites, isLoading } = useQuery({
    queryKey: ['/api/sites'],
  });

  const getTemplateIcon = (templateId: number) => {
    // This would normally come from template data
    switch (templateId) {
      case 1:
        return <FileText className="text-primary h-4 w-4" />;
      case 2:
        return <Presentation className="text-purple-600 h-4 w-4" />;
      case 3:
        return <BarChart3 className="text-orange-600 h-4 w-4" />;
      default:
        return <FileText className="text-slate-600 h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Sites</CardTitle>
          <a href="/sites" className="text-primary hover:text-primary/80 text-sm font-medium">
            View all
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sites && sites.length > 0 ? (
          <div className="space-y-4">
            {sites.slice(0, 3).map((site: any) => (
              <div key={site.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getTemplateIcon(site.templateId)}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{site.name}</h3>
                    <p className="text-sm text-slate-600">{site.prospectName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{site.views || 0} views</p>
                    <p className="text-xs text-slate-500">
                      {site.lastAccessed 
                        ? new Date(site.lastAccessed).toLocaleDateString()
                        : "Never accessed"
                      }
                    </p>
                  </div>
                  <Badge variant={site.isActive ? "default" : "secondary"}>
                    {site.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600">No sites created yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
