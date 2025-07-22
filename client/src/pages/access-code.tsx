import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, ArrowRight } from "lucide-react";

export default function AccessCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState("");

  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/validate-access-code", { accessCode: code });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setLocation(`/onboard/${accessCode}`);
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Access Code",
        description: "Please check your access code and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast({
        title: "Access Code Required",
        description: "Please enter your access code.",
        variant: "destructive",
      });
      return;
    }
    validateCodeMutation.mutate(accessCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Infor CloudSuite Industrial Portal
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Enter your unique access code to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Access Code
              </label>
              <Input
                type="text"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-wider font-mono"
                maxLength={8}
                disabled={validateCodeMutation.isPending}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your access code should be 8 characters long
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={validateCodeMutation.isPending || !accessCode.trim()}
            >
              {validateCodeMutation.isPending ? (
                "Validating..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an access code?{" "}
              <a 
                href="mailto:support@godlan.com" 
                className="text-primary hover:underline font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}