import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Mail, Briefcase, ArrowRight, CheckCircle } from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Onboard() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/onboard/:accessCode");
  const { toast } = useToast();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [siteInfo, setSiteInfo] = useState<any>(null);

  const accessCode = params?.accessCode;

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
    },
  });

  // Validate access code when component mounts
  const { data: validationData, isLoading, error } = useQuery({
    queryKey: ['/api/validate-access-code', accessCode],
    queryFn: async () => {
      if (!accessCode) throw new Error("No access code provided");
      const response = await apiRequest("POST", "/api/validate-access-code", { accessCode });
      const data = await response.json();
      setSiteInfo(data);
      return data;
    },
    enabled: !!accessCode,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (formData: RegistrationForm) => {
      const response = await apiRequest("POST", "/api/register-with-access-code", {
        accessCode,
        ...formData,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.requiresVerification) {
        setRegistrationComplete(true);
        toast({
          title: "Registration Successful!",
          description: "Please check your email for verification instructions.",
        });
      } else {
        // User was logged in automatically (existing user)
        queryClient.setQueryData(["/api/user"], data.user);
        toast({
          title: "Welcome!",
          description: data.message,
        });
        setLocation(`/site/${data.siteId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!accessCode) {
      setLocation("/access-code");
    }
  }, [accessCode, setLocation]);

  const onSubmit = (data: RegistrationForm) => {
    registerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !validationData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Invalid Access Code</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              The access code you entered is invalid or has expired.
            </p>
            <Button onClick={() => setLocation("/access-code")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Check Your Email!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We've sent a verification email to <strong>{form.getValues("email")}</strong>.
              Click the link in the email to complete your registration and access the site.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/access-code")}
                className="w-full"
              >
                Use Different Access Code
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {siteInfo?.siteName}
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {siteInfo?.welcomeMessage}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Title
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your job title" 
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email address" 
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  "Creating Account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access Code: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">{accessCode}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}