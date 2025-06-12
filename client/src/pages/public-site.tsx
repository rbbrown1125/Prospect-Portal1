import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, BarChart3, Lock, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PublicSite() {
  const { id } = useParams();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [site, setSite] = useState<any>(null);

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

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Protected Content</CardTitle>
            <p className="text-slate-600">
              This content is password protected. Please enter the password to continue.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    authenticateMutation.mutate(password);
                  }
                }}
              />
            </div>
            {authenticateMutation.isError && (
              <p className="text-sm text-red-600">
                Invalid password. Please try again.
              </p>
            )}
            <Button 
              className="w-full"
              onClick={() => authenticateMutation.mutate(password)}
              disabled={authenticateMutation.isPending || !password.trim()}
            >
              {authenticateMutation.isPending ? "Verifying..." : "Access Content"}
            </Button>
          </CardContent>
        </Card>
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

  const template = Array.isArray(templates) ? templates.find((t: any) => t.id === site.templateId) : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {template && getTemplateIcon(template.category)}
              <div>
                <h1 className="font-semibold text-slate-900">{site.name}</h1>
                <p className="text-sm text-slate-600">For {site.prospectName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Eye className="h-4 w-4" />
                <span>{site.views || 0} views</span>
              </div>
              <Badge variant="outline">
                {template?.category || 'Content'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Site content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {template?.content?.sections?.map((section: any, index: number) => (
            <div key={index}>
              {renderSection(section, site.customContent, site.prospectName, site.name)}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 py-8 border-t border-slate-200 text-center">
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