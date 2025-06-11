import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, BarChart3 } from "lucide-react";

interface TemplatesSectionProps {
  onSelectTemplate: () => void;
}

export default function TemplatesSection({ onSelectTemplate }: TemplatesSectionProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates'],
  });

  const getTemplateIcon = (category: string) => {
    switch (category?.toLowerCase()) {
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
    <Card>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Available Templates</CardTitle>
          <a href="/templates" className="text-primary hover:text-primary/80 text-sm font-medium">
            Browse all
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                <div className="h-32 bg-slate-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.slice(0, 3).map((template: any) => (
              <div
                key={template.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                onClick={onSelectTemplate}
              >
                <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  {getTemplateIcon(template.category)}
                </div>
                <h3 className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                <div className="flex items-center justify-between mt-4">
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
                  <span className="text-xs text-slate-500">Used {Math.floor(Math.random() * 30)} times</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600">No templates available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
