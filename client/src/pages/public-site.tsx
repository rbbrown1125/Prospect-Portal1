import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, BarChart3, Lock, Eye, Share2 } from "lucide-react";

export default function PublicSite() {
  const [match, params] = useRoute('/site/:id');
  const id = params?.id;
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [site, setSite] = useState<any>(null);

  if (!match || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Site Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested site could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Load site data directly from backend
  const { data: siteData, isLoading: isLoadingSite } = useQuery({
    queryKey: [`/site/${id}`],
    enabled: !!id,
  });

  const recordViewMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/public/sites/${id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    }
  });

  const authenticateMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch(`/api/public/sites/${id}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      recordViewMutation.mutate();
    },
    onError: (error) => {
      console.error("Authentication failed:", error);
    }
  });

  // Handle auto-authentication for sites without passwords
  useEffect(() => {
    if (siteData && !isAuthenticated && !site) {
      const hasPassword = siteData && typeof siteData === 'object' && 'accessPassword' in siteData && siteData.accessPassword;
      if (!hasPassword) {
        setSite(siteData);
        setIsAuthenticated(true);
        recordViewMutation.mutate();
      }
    }
  }, [siteData, isAuthenticated, site]);

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

  // Show loading state
  if (isLoadingSite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if site not found
  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Site Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested site could not be found or is no longer active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if site requires password
  const requiresPassword = siteData && typeof siteData === 'object' && 'accessPassword' in siteData && siteData.accessPassword;

  // Show authentication form if site requires password and user isn't authenticated
  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
                onClick={() => authenticateMutation.mutate(password)}
                disabled={!password || authenticateMutation.isPending}
                className="w-full h-12 text-base font-medium"
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

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Share2 className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-semibold text-slate-900">ProspectShare</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Secure Portal
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
        <div className="text-center py-8 lg:py-16">
          <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
            Welcome {site.prospectName}
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
            Your secure document portal is ready. Access your personalized materials below.
          </p>
        </div>

        <div className="bg-slate-50 border-l-4 border-blue-400 p-4 lg:p-6 rounded-lg mb-8">
          <p className="text-base lg:text-lg text-slate-700">
            Hi {site.prospectName}, we've prepared these exclusive materials specifically for your review. 
            All documents are confidential and tailored to your business needs.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Your Documents</h2>
          <p className="text-base lg:text-lg text-slate-600 mb-8">
            Click any document below to view or download. All files are virus-scanned and secure.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { name: "Proposal Document", size: "2.4 MB", type: "PDF", description: "Custom proposal tailored for your business" },
              { name: "Case Study", size: "1.8 MB", type: "PDF", description: "Relevant case study and ROI analysis" },
              { name: "Pricing Sheet", size: "1.2 MB", type: "Excel", description: "Detailed pricing breakdown" },
            ].map((file, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base truncate">
                      {file.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {file.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {file.type}
                      </span>
                      <span className="text-xs text-slate-500">{file.size}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0">
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
          <p className="text-slate-600 mb-6">
            Your dedicated contact is ready to help. Reach out anytime for assistance.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}