import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, Globe, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Share className="text-white h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">ProspectShare</h1>
          </div>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Create templated, login-protected sites to share sales content with individual prospects. 
            Build professional presentations, track engagement, and close more deals.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
          >
            Get Started with Replit Auth
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Template-Based Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Quickly generate professional sites using pre-built templates for demos, pitch decks, and reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-success mb-2" />
              <CardTitle className="text-lg">Login Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each prospect site is secured with login credentials, ensuring your content stays private.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Share className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Content Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and organize your sales materials in one central library for easy reuse across sites.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">Engagement Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track how prospects interact with your content to optimize your sales approach.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to revolutionize your sales process?
          </h2>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Start Creating Sites Today
          </Button>
        </div>
      </div>
    </div>
  );
}
