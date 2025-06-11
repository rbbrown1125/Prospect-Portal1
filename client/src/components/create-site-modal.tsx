import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileText, Presentation, BarChart3, X } from "lucide-react";

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSiteModal({ isOpen, onClose }: CreateSiteModalProps) {
  const [siteName, setSiteName] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [accessPassword, setAccessPassword] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  const createSiteMutation = useMutation({
    mutationFn: async (siteData: any) => {
      return await apiRequest("POST", "/api/sites", siteData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Site created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create site",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!siteName || !prospectName || !prospectEmail || !selectedTemplateId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a template",
        variant: "destructive",
      });
      return;
    }

    createSiteMutation.mutate({
      name: siteName,
      prospectName,
      prospectEmail,
      templateId: selectedTemplateId,
      accessPassword,
      isActive: true,
    });
  };

  const handleClose = () => {
    setSiteName("");
    setProspectName("");
    setProspectEmail("");
    setSelectedTemplateId(null);
    setAccessPassword("");
    onClose();
  };

  const getTemplateIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'sales':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'startup':
        return <Presentation className="h-5 w-5 text-purple-600" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5 text-success" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Site
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name"
              required
            />
          </div>
          
          <div>
            <Label>Prospect Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Input
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="Prospect name"
                required
              />
              <Input
                type="email"
                value={prospectEmail}
                onChange={(e) => setProspectEmail(e.target.value)}
                placeholder="Prospect email"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accessPassword">Access Password (Optional)</Label>
            <Input
              id="accessPassword"
              type="password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              placeholder="Set a password for site access"
            />
          </div>
          
          <div>
            <Label>Select Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {templates?.map((template: any) => (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-center space-x-3">
                    {getTemplateIcon(template.category)}
                    <div>
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">{template.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createSiteMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createSiteMutation.isPending ? "Creating..." : "Create Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
