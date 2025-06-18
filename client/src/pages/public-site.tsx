import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, BarChart3, Lock, Eye, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PublicSite() {
  const [, params] = useRoute('/site/:id');
  const id = params?.id;
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [site, setSite] = useState<any>(null);

  // Fetch basic site info first
  const { data: siteInfo } = useQuery({
    queryKey: ['/api/public/sites', id],
    queryFn: async () => {
      const response = await fetch(`/api/public/sites/${id}`);
      if (!response.ok) {
        throw new Error('Site not found');
      }
      return response.json();
    },
    enabled: !!id,
  });

  // For sites without password, try to authenticate automatically
  const autoAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/public/sites/${id}/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: "" })
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSite(data);
      setIsAuthenticated(true);
      recordViewMutation.mutate();
    },
  });

  // Auto-authenticate if site doesn't require password
  useEffect(() => {
    if (siteInfo && !siteInfo.requiresPassword && !isAuthenticated && !site) {
      autoAuthMutation.mutate();
    }
  }, [siteInfo, isAuthenticated, site]);

  const authenticateMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch(`/api/public/sites/${id}/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSite(data);
      setIsAuthenticated(true);
      // Record the site view
      recordViewMutation.mutate();
    },
    onError: (error) => {
      console.error("Authentication failed:", error);
    }
  });

  const recordViewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/public/sites/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Failed to record view');
      }
      
      return response.json();
    }
  });

  // Templates are not needed for public site rendering

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

  const renderSection = (section: any, customContent: any, prospectName: string, siteName: string) => {
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
        company: siteName || "Our Company",
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
          <div className="text-center py-8 lg:py-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4 px-4">
              {replaceVariables(section.title)}
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
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
          <div className="py-8 lg:py-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6 lg:mb-8 text-center px-4">
              {replaceVariables(section.title)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {section.items?.map((item: string, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4 lg:p-6 text-center">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 lg:mb-4">
                      <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm lg:text-base">
                      {replaceVariables(item)}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'file_section':
      case 'file_gallery':
      case 'media_files':
      case 'deliverables':
      case 'secure_files':
        return (
          <div className="py-8 lg:py-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 lg:mb-6 px-4">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-base lg:text-lg text-slate-600 mb-6 lg:mb-8 px-4">
              {replaceVariables(section.content)}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {section.files?.map((file: any, index: number) => (
                <Card key={index} className="p-4 lg:p-6">
                  <div className="flex items-start space-x-3 lg:space-x-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm lg:text-base truncate">
                        {replaceVariables(file.name)}
                      </h3>
                      <p className="text-xs lg:text-sm text-slate-600 mt-1">
                        {replaceVariables(file.description)}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {file.type}
                        </span>
                        <span className="text-xs text-slate-500">{file.size}</span>
                        {file.security && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            {file.security}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">↓</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'file_categories':
        return (
          <div className="py-8 lg:py-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 lg:mb-6 px-4">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-base lg:text-lg text-slate-600 mb-6 lg:mb-8 px-4">
              {replaceVariables(section.content)}
            </p>
            <div className="space-y-6 lg:space-y-8">
              {section.categories?.map((category: any, categoryIndex: number) => (
                <div key={categoryIndex}>
                  <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-3 lg:mb-4 px-4">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    {category.files?.map((file: any, fileIndex: number) => (
                      <Card key={fileIndex} className="p-3 lg:p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm lg:text-base truncate">
                              {replaceVariables(file.name)}
                            </h4>
                            <p className="text-xs lg:text-sm text-slate-600">
                              {replaceVariables(file.description)}
                            </p>
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded mt-1 inline-block">
                              {file.type}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'overview':
      case 'introduction':
      case 'welcome':
      case 'project_summary':
      case 'package_info':
      case 'security_notice':
        return (
          <div className="py-6 lg:py-8">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 lg:mb-4 px-4">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-slate-50 border-l-4 border-blue-400 p-4 lg:p-6 rounded-lg mx-4">
              <p className="text-base lg:text-lg text-slate-700">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'security_header':
        return (
          <div className="text-center py-8 lg:py-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4 px-4">
              {replaceVariables(section.title)}
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              {replaceVariables(section.subtitle)}
            </p>
          </div>
        );

      case 'next_steps':
      case 'warranty':
      case 'usage_rights':
      case 'technical_support':
      case 'security_footer':
      case 'support':
        return (
          <div className="py-6 lg:py-8">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 lg:mb-4 px-4">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 lg:p-6 rounded-lg mx-4">
              <p className="text-base lg:text-lg text-slate-700">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'pricing':
      case 'investment':
        return (
          <div className="py-8 lg:py-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 lg:mb-6 text-center px-4">
              {replaceVariables(section.title)}
            </h2>
            <div className="bg-primary/5 border border-primary/20 p-6 lg:p-8 rounded-lg text-center mx-4">
              <p className="text-xl lg:text-2xl font-bold text-primary mb-4">
                {replaceVariables(section.content)}
              </p>
            </div>
          </div>
        );

      case 'cta':
      case 'contact':
        return (
          <div className="py-8 lg:py-12 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 lg:mb-6 px-4">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-base lg:text-lg text-slate-600 mb-6 lg:mb-8 px-4">
              {replaceVariables(section.content)}
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
              Contact Us
            </Button>
          </div>
        );

      default:
        return (
          <div className="py-6 lg:py-8">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 lg:mb-4 px-4">
              {replaceVariables(section.title)}
            </h2>
            <p className="text-slate-700 px-4">
              {replaceVariables(section.content)}
            </p>
          </div>
        );
    }
  };

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* ProspectShare Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Share2 className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">ProspectShare</span>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Secure Content Access</CardTitle>
              <p className="text-slate-600">
                This content has been created specifically for you and is password protected.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Access Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password provided to you"
                  className="h-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      authenticateMutation.mutate(password);
                    }
                  }}
                />
              </div>
              {authenticateMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    The password you entered is incorrect. Please check with your contact and try again.
                  </p>
                </div>
              )}
              <Button 
                className="w-full h-12 text-base"
                onClick={() => authenticateMutation.mutate(password)}
                disabled={authenticateMutation.isPending || !password.trim()}
              >
                {authenticateMutation.isPending ? "Verifying Access..." : "Access Content"}
              </Button>
              <div className="text-center pt-4">
                <p className="text-xs text-slate-500">
                  Need help accessing this content? Contact your sales representative.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const template = templates && Array.isArray(templates) ? templates.find((t: any) => t.id === site.templateId) : null;
  
  // Parse template content if it's a string
  let templateContent = template?.content;
  if (typeof templateContent === 'string') {
    try {
      templateContent = JSON.parse(templateContent);
    } catch (e) {
      console.error('Failed to parse template content:', e);
      templateContent = null;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
              {template && getTemplateIcon(template.category)}
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-slate-900 text-sm lg:text-base truncate">{site.name}</h1>
                <p className="text-xs lg:text-sm text-slate-600 truncate">For {site.prospectName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2 text-xs lg:text-sm text-slate-600">
                <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>{site.views || 0} views</span>
              </div>
              <Badge variant="outline" className="text-xs lg:text-sm">
                {template?.category || 'Content'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Site content */}
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
        <div className="space-y-6 lg:space-y-8">
          {templateContent?.sections?.map((section: any, index: number) => (
            <div key={index}>
              {renderSection(section, site.customContent, site.prospectName, site.name)}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 lg:mt-16 py-6 lg:py-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            This content was created specifically for {site.prospectName}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Powered by ProspectShare
          </p>
        </div>
      </div>
    </div>
  );
}