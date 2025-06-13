import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Save, Eye, Edit3, Type, Image, FileText, Plus, Trash2, GripVertical } from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';
import Sidebar from '@/components/sidebar';

export default function SiteEdit() {
  const [, params] = useRoute('/sites/:id/edit');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [siteName, setSiteName] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [templateSections, setTemplateSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<any>(null);

  const { data: site, isLoading } = useQuery({
    queryKey: ['/api/sites', params?.id],
    enabled: !!params?.id,
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  useEffect(() => {
    if (site) {
      setSiteName(site.name || '');
      setProspectName(site.prospectName || '');
      setProspectCompany(site.prospectCompany || '');
      setProspectEmail(site.prospectEmail || '');
      setPassword(site.password || '');
      setCustomContent(site.customContent || '');
    }
  }, [site]);

  useEffect(() => {
    if (templates && site) {
      const template = templates.find((t: any) => t.id === site.templateId);
      if (template?.content?.sections) {
        setTemplateSections([...template.content.sections]);
      }
    }
  }, [templates, site]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/sites/${params?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Site updated",
        description: "Your site has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sites', params?.id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update site. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name: siteName,
      prospectName,
      prospectCompany,
      prospectEmail,
      password,
      customContent,
      templateSections,
    });
  };

  const handleSectionEdit = (section: any, index: number) => {
    setEditingSection({ ...section, index });
  };

  const handleSectionUpdate = (updatedSection: any) => {
    const newSections = [...templateSections];
    newSections[editingSection.index] = updatedSection;
    setTemplateSections(newSections);
    setEditingSection(null);
  };

  const handleSectionDelete = (index: number) => {
    const newSections = templateSections.filter((_, i) => i !== index);
    setTemplateSections(newSections);
  };

  const handleSectionAdd = (type: string) => {
    const newSection = {
      type,
      title: 'New Section',
      content: 'Enter your content here...',
      id: Date.now().toString(),
    };
    setTemplateSections([...templateSections, newSection]);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero':
      case 'header':
        return <Type className="h-4 w-4" />;
      case 'file_section':
      case 'file_gallery':
      case 'deliverables':
        return <FileText className="h-4 w-4" />;
      case 'features':
        return <Edit3 className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const renderSectionPreview = (section: any) => {
    switch (section.type) {
      case 'hero':
      case 'header':
        return (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded border">
            <h3 className="font-bold text-lg">{section.title}</h3>
            <p className="text-slate-600">{section.subtitle || section.content}</p>
          </div>
        );
      case 'file_section':
      case 'file_gallery':
        return (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600 mb-2">{section.content}</p>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                {section.files?.length || 0} files
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="border p-4 rounded">
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {section.content?.substring(0, 100)}...
            </p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading site...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Site not found</h1>
            <p className="text-slate-600 mb-4">The site you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/sites')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sites
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const template = templates && Array.isArray(templates) ? templates.find((t: any) => t.id === site.templateId) : null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/sites')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Sites</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Edit Site</h1>
                <p className="text-slate-600 mt-1 text-sm lg:text-base">
                  {template?.name} template
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/site/${site.id}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Preview</span>
                <span className="sm:hidden">👁</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="settings">Site Settings</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-6">
                {/* Visual No-Code Editor */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Visual Content Editor</CardTitle>
                      <p className="text-sm text-slate-600">
                        Drag and drop sections to rearrange, click to edit content
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSectionAdd('hero')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {templateSections.map((section, index) => (
                        <Card key={section.id || index} className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                                {getSectionIcon(section.type)}
                                <Badge variant="outline" className="text-xs">
                                  {section.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSectionEdit(section, index)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSectionDelete(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {renderSectionPreview(section)}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {templateSections.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                          <Type className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 mb-2">No sections yet</h3>
                          <p className="text-slate-600 mb-4">Add your first section to start building your site</p>
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSectionAdd('hero')}
                            >
                              <Type className="h-4 w-4 mr-2" />
                              Hero Section
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSectionAdd('file_section')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              File Section
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Section Editor Modal */}
                {editingSection && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Edit {editingSection.type.replace('_', ' ')} Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={editingSection.title}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            title: e.target.value
                          })}
                          placeholder="Enter section title"
                        />
                      </div>
                      
                      {editingSection.type === 'hero' && (
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={editingSection.subtitle || ''}
                            onChange={(e) => setEditingSection({
                              ...editingSection,
                              subtitle: e.target.value
                            })}
                            placeholder="Enter subtitle"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={editingSection.content}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            content: e.target.value
                          })}
                          placeholder="Enter section content"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingSection(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSectionUpdate(editingSection)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Site Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Site Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="siteName">Site Name</Label>
                        <Input
                          id="siteName"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          placeholder="Enter site name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Access Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter access password"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Prospect Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prospect Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prospectName">Prospect Name</Label>
                        <Input
                          id="prospectName"
                          value={prospectName}
                          onChange={(e) => setProspectName(e.target.value)}
                          placeholder="Enter prospect name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prospectCompany">Company</Label>
                        <Input
                          id="prospectCompany"
                          value={prospectCompany}
                          onChange={(e) => setProspectCompany(e.target.value)}
                          placeholder="Enter company name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="prospectEmail">Email (Optional)</Label>
                      <Input
                        id="prospectEmail"
                        type="email"
                        value={prospectEmail}
                        onChange={(e) => setProspectEmail(e.target.value)}
                        placeholder="Enter prospect email"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Template Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-sm">
                        {template?.category || 'Content'}
                      </Badge>
                      <span className="font-medium">{template?.name}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      {template?.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Custom Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Notes</CardTitle>
                    <p className="text-sm text-slate-600">
                      Add any custom notes or special instructions for this prospect.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Enter custom notes or special instructions..."
                      rows={6}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                {/* Site Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Site Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{site?.views || 0}</div>
                        <div className="text-sm text-slate-600">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {site?.isActive ? 'Active' : 'Draft'}
                        </div>
                        <div className="text-sm text-slate-600">Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-700">
                          {site?.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-700">
                          {site?.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">Last Updated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}