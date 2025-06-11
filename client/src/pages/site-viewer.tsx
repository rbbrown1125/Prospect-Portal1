import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Presentation, BarChart3, Eye, Share2 } from "lucide-react";

export default function SiteViewer() {
  const { id } = useParams();

  const { data: site, isLoading } = useQuery({
    queryKey: [`/api/sites/${id}`],
  });

  const { data: templates } = useQuery({
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

  const renderSection = (section: any, customContent: any, prospectName: string) => {
    const replaceVariables = (text: string) => {
      if (!text) return text;
      
      // First replace with custom content if available
      let replacedText = text;
      if (customContent) {
        Object.keys(customContent).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          replacedText = replacedText.replace(regex, customContent[key]);
        });
      }
      
      // Replace prospect name
      replacedText = replacedText.replace(/\{\{prospect_name\}\}/g, prospectName);
      
      // Replace remaining variables with defaults
      const defaults: { [key: string]: string } = {
        company: site?.name || "Your Company",
        tagline: "Excellence in Every Detail",
        problem_statement: "Market challenges require innovative solutions",
        solution_details: "Our comprehensive approach delivers results",
        feature_1: "Advanced Feature Set",
        feature_2: "Seamless Integration", 
        feature_3: "24/7 Support",
        pricing_info: "Contact us for pricing details",
        call_to_action: "Get in touch to learn more"
      };
      
      Object.keys(defaults).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        replacedText = replacedText.replace(regex, defaults[key]);
      });
      
      return replacedText;
    };

    switch (section.type) {
      case 'hero':
      case 'cover':
      case 'header':
        return (
          <div className="text-center py-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {replaceVariables(section.title)}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {replaceVariables(section.subtitle)}
            </p>
          </div>
        );

      case 'problem':
      case 'challenge':
        return (
          <div className="py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
              <p className="text-lg text-slate-700">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'solution':
      case 'approach':
        return (
          <div className="py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
              <p className="text-lg text-slate-700">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              {replaceVariables(section.title)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.items?.map((item: string, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-slate-900">
                      {replaceVariables(item)}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'pricing':
      case 'investment':
        return (
          <div className="py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-primary/5 border border-primary/20 p-8 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary mb-4">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'cta':
      case 'contact':
        return (
          <div className="py-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              {replaceVariables(section.content)}
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
              Contact Us
            </Button>
          </div>
        );

      default:
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-slate-700">
              {replaceVariables(section.content)}
            </p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Site Not Found</h1>
          <p className="text-slate-600">The requested site could not be found.</p>
        </div>
      </div>
    );
  }

  const template = templates?.find((t: any) => t.id === site.templateId);
  const publicUrl = `${window.location.origin}/site/${site.id}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                {template && getTemplateIcon(template.category)}
                <div>
                  <h1 className="font-semibold text-slate-900">{site.name}</h1>
                  <p className="text-sm text-slate-600">For {site.prospectName}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Eye className="h-4 w-4" />
                <span>{site.views || 0} views</span>
              </div>
              <Badge variant={site.isActive ? "default" : "secondary"}>
                {site.isActive ? "Active" : "Draft"}
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Site content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {template?.content?.sections?.map((section: any, index: number) => (
            <div key={index}>
              {renderSection(section, site.customContent, site.prospectName)}
            </div>
          ))}
        </div>

        {/* Site info */}
        <div className="mt-16 py-8 border-t border-slate-200">
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Site Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Site Name:</span>
                <span className="ml-2 font-medium">{site.name}</span>
              </div>
              <div>
                <span className="text-slate-600">Prospect:</span>
                <span className="ml-2 font-medium">{site.prospectName}</span>
              </div>
              <div>
                <span className="text-slate-600">Email:</span>
                <span className="ml-2 font-medium">{site.prospectEmail}</span>
              </div>
              <div>
                <span className="text-slate-600">Template:</span>
                <span className="ml-2 font-medium">{template?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-600">Created:</span>
                <span className="ml-2 font-medium">{new Date(site.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-600">Status:</span>
                <span className="ml-2 font-medium">{site.isActive ? 'Active' : 'Draft'}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-slate-600">Public URL:</span>
              <div className="mt-2 flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border text-sm flex-1">
                  {publicUrl}
                </code>
                <Button 
                  size="sm" 
                  onClick={() => window.open(publicUrl, '_blank')}
                >
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}