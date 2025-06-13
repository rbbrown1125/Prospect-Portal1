import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Presentation, BarChart3 } from "lucide-react";
import CreateSiteModal from "@/components/create-site-modal";

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates'],
  });

  const handleUseTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setShowCreateModal(true);
  };

  const getTemplateIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales':
        return <FileText className="h-6 w-6 text-primary" />;
      case 'startup':
        return <Presentation className="h-6 w-6 text-purple-600" />;
      case 'analytics':
        return <BarChart3 className="h-6 w-6 text-success" />;
      default:
        return <FileText className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
              <p className="text-slate-600 mt-1">Choose from professional templates for your prospect sites</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-slate-200 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center">
                    {getTemplateIcon(template.category)}
                  </div>
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary"
                        className={
                          template.category === 'Sales' ? 'bg-primary/10 text-primary' :
                          template.category === 'Startup' ? 'bg-purple-100 text-purple-800' :
                          template.category === 'Analytics' ? 'bg-success/10 text-success' :
                          'bg-slate-100 text-slate-800'
                        }
                      >
                        {template.category}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/preview/template/${template.id}`, '_blank')}
                        >
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No templates available</h3>
              <p className="text-slate-600">Templates will appear here once they are created.</p>
            </div>
          )}
        </div>
      </main>

      <CreateSiteModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTemplateId(null);
        }}
        preSelectedTemplateId={selectedTemplateId}
      />
    </div>
  );
}
