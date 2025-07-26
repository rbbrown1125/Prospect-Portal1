import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Presentation, BarChart3, X, CheckCircle, ExternalLink, Copy, Plus, Edit3, Type, Image, Trash2 } from "lucide-react";

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTemplateId?: number | null;
}

export default function CreateSiteModal({ isOpen, onClose, preSelectedTemplateId }: CreateSiteModalProps) {
  const [siteName, setSiteName] = useState("");
  const [selectedProspectId, setSelectedProspectId] = useState<string>("");
  const [isNewProspect, setIsNewProspect] = useState(true);
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(preSelectedTemplateId || null);
  const [generateAccessCode, setGenerateAccessCode] = useState(false);
  const [createdSite, setCreatedSite] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [templateSections, setTemplateSections] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  const { data: prospects } = useQuery({
    queryKey: ['/api/prospects'],
  });

  // Update selected template when preSelectedTemplateId changes
  useEffect(() => {
    if (preSelectedTemplateId) {
      setSelectedTemplateId(preSelectedTemplateId);
    }
  }, [preSelectedTemplateId]);

  // Load template sections when template is selected
  useEffect(() => {
    if (Array.isArray(templates) && selectedTemplateId) {
      const template = templates.find((t: any) => t.id === selectedTemplateId);
      
      if (template?.content) {
        let templateContent = template.content;
        
        // Parse template content if it's a string
        if (typeof templateContent === 'string') {
          try {
            templateContent = JSON.parse(templateContent);
          } catch (e) {
            console.error('Failed to parse template content:', e);
            templateContent = {};
          }
        }
        
        if (templateContent && typeof templateContent === 'object' && 'sections' in templateContent) {
          const sectionsWithIds = (templateContent.sections as any[]).map((section, index) => ({
            ...section,
            id: section.id || `section-${index}`,
          }));
          setTemplateSections(sectionsWithIds);
        } else {
          setTemplateSections([]);
        }
      }
    }
  }, [templates, selectedTemplateId]);

  const createSiteMutation = useMutation({
    mutationFn: async (siteData: any) => {
      const response = await apiRequest("POST", "/api/sites", siteData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedSite(data);
      setShowSuccess(true);
      
      // Generate public URL and copy to clipboard
      const publicUrl = `${window.location.origin}/site/${data.id}`;
      navigator.clipboard.writeText(publicUrl).then(() => {
        toast({
          title: "Site Created Successfully!",
          description: "Public URL has been copied to your clipboard",
        });
      }).catch(() => {
        toast({
          title: "Site Created Successfully!",
          description: "Site created but failed to copy URL to clipboard",
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
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
      prospectCompany,
      templateId: selectedTemplateId,
      generateAccessCode,
      customContent: templateSections.length > 0 ? { sections: templateSections } : null,
      isActive: true,
    });
  };

  const handleClose = () => {
    setSiteName("");
    setSelectedProspectId("");
    setIsNewProspect(true);
    setProspectName("");
    setProspectEmail("");
    setProspectCompany("");
    setSelectedTemplateId(preSelectedTemplateId || null);
    setGenerateAccessCode(false);
    setCreatedSite(null);
    setShowSuccess(false);
    setTemplateSections([]);
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'sales':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'startup':
        return <Presentation className="h-5 w-5 text-purple-600" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5 text-success" />;
      case 'file sharing':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
  };

  if (showSuccess && createdSite) {
    const publicUrl = `${window.location.origin}/site/${createdSite.id}`;
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Site Created Successfully!</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium text-slate-900 mb-2">
                {createdSite.name}
              </div>
              <div className="text-sm text-slate-600">
                Created for {createdSite.prospectName}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Public URL</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={publicUrl}
                    readOnly
                    className="flex-1 bg-slate-50"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(publicUrl)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {createdSite.accessCode && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">Access Code</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={createdSite.accessCode}
                      readOnly
                      className="flex-1 bg-slate-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(createdSite.accessCode)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this code with users to allow them to register and access the site
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open(publicUrl, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1"
              >
                Create Another Site
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            Create New Site
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
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
            <div className="space-y-4 mt-2">
              {/* Prospect Selection Toggle */}
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant={!isNewProspect ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsNewProspect(false);
                    setProspectName("");
                    setProspectEmail("");
                    setProspectCompany("");
                  }}
                >
                  Select Existing Prospect
                </Button>
                <Button
                  type="button"
                  variant={isNewProspect ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsNewProspect(true);
                    setSelectedProspectId("");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Prospect
                </Button>
              </div>

              {!isNewProspect ? (
                /* Existing Prospect Dropdown */
                <div>
                  <Select
                    value={selectedProspectId}
                    onValueChange={(value) => {
                      setSelectedProspectId(value);
                      const selectedProspect = Array.isArray(prospects) ? 
                        prospects.find((p: any) => p.id === value) : null;
                      if (selectedProspect) {
                        setProspectName(selectedProspect.name);
                        setProspectEmail(selectedProspect.email);
                        setProspectCompany(selectedProspect.company || "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prospect..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(prospects) && prospects.length > 0 ? (
                        prospects.map((prospect: any) => (
                          <SelectItem key={prospect.id} value={prospect.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{prospect.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {prospect.email} {prospect.company && `• ${prospect.company}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-prospects" disabled>
                          No prospects available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* New Prospect Form */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Input
                    value={prospectCompany}
                    onChange={(e) => setProspectCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generateAccessCode"
                checked={generateAccessCode}
                onChange={(e) => setGenerateAccessCode(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="generateAccessCode" className="font-normal cursor-pointer">
                Generate access code for user registration (sends email invitations)
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enable this to allow users to register and access this site via unique access codes
            </p>
          </div>
          
          <div>
            <Label>Select Template</Label>
            <div className="max-h-96 overflow-y-auto mt-2 border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(templates) ? templates.map((template: any) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getTemplateIcon(template.category)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{template.name}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{template.description}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded mt-2">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </Card>
                )) : <div className="text-slate-500 text-sm">Loading templates...</div>}
              </div>
            </div>
          </div>

          {/* Template Sections Preview */}
          {templateSections.length > 0 && (
            <div>
              <Label>Template Sections ({templateSections.length})</Label>
              <div className="max-h-64 overflow-y-auto mt-2 border border-slate-200 rounded-lg">
                <div className="divide-y divide-slate-100">
                  {templateSections.map((section, index) => (
                    <div key={section.id || index} className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {section.type === 'hero' || section.type === 'cover' || section.type === 'header' ? <Type className="h-4 w-4 text-primary" /> :
                           section.type === 'file_section' || section.type === 'file_gallery' ? <FileText className="h-4 w-4 text-primary" /> :
                           <FileText className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-slate-900 truncate">
                            {section.title || `${section.type} section`}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {section.content || section.subtitle || 'No content'}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded mt-1">
                            {section.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                These sections will be included in your site. You can edit them after creation.
              </p>
            </div>
          )}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
