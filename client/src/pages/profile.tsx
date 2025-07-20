import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Bell,
  Monitor,
  Menu,
  Save,
  LogOut
} from "lucide-react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        email: (user as any)?.email || '',
        phone: (user as any)?.phone || '',
        company: (user as any)?.company || '',
        title: (user as any)?.title || '',
        location: (user as any)?.location || '',
      });
    }
  }, [user]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    location: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setIsMobileSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <Sidebar />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={(user as any)?.profileImageUrl} />
                    <AvatarFallback className="text-lg">
                      {(user as any)?.firstName?.[0] || 'U'}{(user as any)?.lastName?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold">
                        {(user as any)?.firstName || ''} {(user as any)?.lastName || ''}
                      </h1>
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        @godlan.com
                      </Badge>
                    </div>
                    <p className="text-slate-600 mt-1">{(user as any)?.email}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Member since {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 py-2">{(user as any)?.firstName || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 py-2">{(user as any)?.lastName || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center space-x-2 py-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{(user as any)?.email}</p>
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <p className="text-sm text-slate-900">{(user as any)?.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    {isEditing ? (
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Godlan"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 py-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <p className="text-sm text-slate-900">{(user as any)?.company || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    {isEditing ? (
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Sales Manager"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 py-2">{(user as any)?.title || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, State"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 py-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <p className="text-sm text-slate-900">{(user as any)?.location || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-slate-600">Receive notifications about site views and updates</p>
                  </div>
                  <Badge variant="secondary">
                    <Bell className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security</h4>
                    <p className="text-sm text-slate-600">Two-factor authentication and security settings</p>
                  </div>
                  <Badge variant="outline">
                    <Key className="h-3 w-3 mr-1" />
                    Godlan SSO
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}