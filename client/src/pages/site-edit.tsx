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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Save, Eye, Edit3, Type, Image, FileText, Plus, Trash2, GripVertical, Upload, Link2, FolderOpen, Grid3X3, List, Columns, X, Copy } from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';
import Sidebar from '@/components/sidebar';
import { Site, Template } from '@shared/schema';

export default function SiteEdit() {
  const [, params] = useRoute('/sites/:id/edit');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [siteName, setSiteName] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [customContent, setCustomContent] = useState('');
  // Better type definitions for improved type safety
  interface SectionData {
    id: string;
    type: string;
    title: string;
    content?: string;
    subtitle?: string;
    files?: any[];
    categories?: any[];
  }

  interface GridColumn {
    id: string;
    sections: SectionData[];
  }

  const [templateSections, setTemplateSections] = useState<SectionData[]>([]);
  const [editingSection, setEditingSection] = useState<SectionData | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Custom');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadMode, setFileUploadMode] = useState<'upload' | 'library'>('library');
  const [gridLayout, setGridLayout] = useState<GridColumn[]>([
    { id: 'col-1', sections: [] },
    { id: 'col-2', sections: [] }
  ]);
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'grid'>('vertical');
  const [draggedSection, setDraggedSection] = useState<SectionData | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number>(-1);

  const { data: site, isLoading } = useQuery<Site>({
    queryKey: ['/api/sites', params?.id],
    enabled: !!params?.id,
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const { data: contentLibrary } = useQuery({
    queryKey: ['/api/content'],
  });

  const { data: files } = useQuery({
    queryKey: ['/api/files'],
  });

  useEffect(() => {
    if (site) {
      setSiteName(site.name || '');
      setProspectName(site.prospectName || '');
      setProspectCompany(site.prospectCompany || '');
      setProspectEmail(site.prospectEmail || '');
      setCustomContent(typeof site.customContent === 'string' ? site.customContent : JSON.stringify(site.customContent || {}));
    }
  }, [site]);

  useEffect(() => {
    // Load actual template content when site and templates are available
    if (Array.isArray(templates) && site && site.templateId) {
      const template = templates.find(t => t.id === site.templateId);
      
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
        
        // Load actual template sections with real content
        if (templateContent && typeof templateContent === 'object' && 'sections' in templateContent) {
          const sectionsWithIds = (templateContent.sections as any[]).map((section, index) => ({
            ...section,
            id: section.id || `section-${index}`,
            // Replace template variables with actual prospect data
            title: section.title?.replace('{{prospect_name}}', site.prospectName)
                                 .replace('{{company_name}}', site.prospectCompany || 'your company')
                                 .replace('{{prospect_company}}', site.prospectCompany || 'your company'),
            subtitle: section.subtitle?.replace('{{prospect_name}}', site.prospectName)
                                      .replace('{{company_name}}', site.prospectCompany || 'your company')
                                      .replace('{{prospect_company}}', site.prospectCompany || 'your company'),
            content: section.content?.replace('{{prospect_name}}', site.prospectName)
                                    .replace('{{company_name}}', site.prospectCompany || 'your company')
                                    .replace('{{prospect_company}}', site.prospectCompany || 'your company')
          }));
          setTemplateSections(sectionsWithIds);
        }
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
      customContent,
      templateSections,
    });
  };

  const handleSectionEdit = (section: SectionData, index: number) => {
    setEditingSection({ ...section, index } as any);
  };

  const handleSectionUpdate = (updatedSection: SectionData) => {
    if (!editingSection || !('index' in editingSection)) return;
    
    const newSections = [...templateSections];
    newSections[(editingSection as any).index] = updatedSection;
    setTemplateSections(newSections);
    setEditingSection(null);
  };

  const handleSectionDelete = (index: number) => {
    const newSections = templateSections.filter((_, i) => i !== index);
    setTemplateSections(newSections);
  };

  const handleSectionAdd = (type: string) => {
    const newSection: SectionData = {
      type,
      title: 'New Section',
      content: 'Enter your content here...',
      id: `section-${Date.now()}`,
    };
    
    if (layoutMode === 'grid' && gridLayout.length > 0) {
      // Add to first column in grid mode
      const newGridLayout = [...gridLayout];
      newGridLayout[0].sections.push(newSection);
      setGridLayout(newGridLayout);
    } else {
      // Add to vertical layout
      setTemplateSections([...templateSections, newSection]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem !== index) {
      setDraggedOver(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem !== index) {
      setDraggedOver(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the container, not entering a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }
    
    const newSections = [...templateSections];
    const draggedSection = newSections[draggedItem];
    
    // Remove the dragged item
    newSections.splice(draggedItem, 1);
    
    // Insert at the new position
    const adjustedDropIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newSections.splice(adjustedDropIndex, 0, draggedSection);
    
    setTemplateSections(newSections);
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero':
      case 'header':
      case 'cover':
        return <Type className="h-4 w-4" />;
      case 'file_section':
      case 'file_gallery':
      case 'file_categories':
      case 'deliverables':
        return <FileText className="h-4 w-4" />;
      case 'features':
      case 'overview':
      case 'introduction':
      case 'welcome':
      case 'project_summary':
        return <Edit3 className="h-4 w-4" />;
      case 'contact':
      case 'support':
      case 'next_steps':
        return <Type className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const renderSectionPreview = (section: any) => {
    switch (section.type) {
      case 'hero':
      case 'header':
      case 'cover':
        return (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded border">
            <h3 className="font-bold text-lg">{section.title}</h3>
            {section.subtitle && <p className="text-slate-600 mt-1">{section.subtitle}</p>}
            {section.content && <p className="text-sm text-slate-500 mt-2">{section.content}</p>}
          </div>
        );
      case 'file_section':
      case 'file_gallery':
      case 'deliverables':
        return (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            {section.content && <p className="text-sm text-slate-600 mb-2">{section.content}</p>}
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                {section.files?.length || 0} files
              </span>
            </div>
          </div>
        );
      case 'file_categories':
        return (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            {section.content && <p className="text-sm text-slate-600 mb-2">{section.content}</p>}
            <div className="space-y-2">
              {section.categories?.map((category: any, index: number) => (
                <div key={index} className="bg-slate-50 p-2 rounded">
                  <div className="font-medium text-sm">{category.name}</div>
                  <div className="text-xs text-slate-600">{category.files?.length || 0} files</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'overview':
      case 'introduction':
      case 'welcome':
      case 'project_summary':
        return (
          <div className="border p-4 rounded bg-blue-50">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600">
              {section.content?.substring(0, 150)}
              {section.content?.length > 150 ? '...' : ''}
            </p>
          </div>
        );
      case 'contact':
      case 'support':
      case 'next_steps':
        return (
          <div className="border p-4 rounded bg-green-50">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600">
              {section.content?.substring(0, 100)}
              {section.content?.length > 100 ? '...' : ''}
            </p>
          </div>
        );
      default:
        return (
          <div className="border p-4 rounded">
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {section.content?.substring(0, 100)}
              {section.content?.length > 100 ? '...' : ''}
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

  const template = templates && Array.isArray(templates) ? templates.find(t => t.id === site?.templateId) : null;

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
                onClick={() => window.open(`/site/${site?.id}`, '_blank')}
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
                        {layoutMode === 'grid' 
                          ? 'Drag sections between columns to create custom layouts'
                          : 'Drag and drop sections to rearrange, click to edit content'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Layout Mode Toggle */}
                      <div className="flex items-center space-x-1 border rounded-md p-1">
                        <Button
                          variant={layoutMode === 'vertical' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLayoutMode('vertical')}
                          className="h-8 px-3"
                        >
                          <List className="h-4 w-4 mr-1" />
                          Vertical
                        </Button>
                        <Button
                          variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLayoutMode('grid')}
                          className="h-8 px-3"
                        >
                          <Grid3X3 className="h-4 w-4 mr-1" />
                          Grid
                        </Button>
                      </div>
                      
                      {layoutMode === 'grid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGridLayout([...gridLayout, { 
                              id: `col-${Date.now()}`, 
                              sections: [] 
                            }]);
                          }}
                        >
                          <Columns className="h-4 w-4 mr-2" />
                          Add Column
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSectionAdd('hero')}>
                            <Type className="h-4 w-4 mr-2" />
                            Hero Section
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSectionAdd('file_section')}>
                            <FileText className="h-4 w-4 mr-2" />
                            File Section
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSectionAdd('file_gallery')}>
                            <FileText className="h-4 w-4 mr-2" />
                            File Gallery
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSectionAdd('overview')}>
                            <Type className="h-4 w-4 mr-2" />
                            Overview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSectionAdd('features')}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Features
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSectionAdd('cta')}>
                            <Type className="h-4 w-4 mr-2" />
                            Call to Action
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {layoutMode === 'vertical' ? (
                      /* Vertical Layout */
                      <div className="space-y-4">
                        {templateSections.map((section, index) => (
                          <Card 
                            key={section.id || index} 
                            className={`border-2 border-dashed transition-all duration-200 cursor-move ${
                              draggedItem === index 
                                ? 'border-primary bg-primary/5 opacity-50' 
                                : draggedOver === index 
                                ? 'border-primary/70 bg-primary/10' 
                                : 'border-slate-200 hover:border-primary/50'
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <GripVertical className="h-4 w-4 text-slate-400 cursor-grab active:cursor-grabbing" />
                                  {getSectionIcon(section.type)}
                                  <Badge variant="outline" className="text-xs">
                                    {section.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSectionEdit(section, index);
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSectionDelete(index);
                                    }}
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
                    ) : (
                      /* Grid Layout */
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridLayout.length}, 1fr)` }}>
                        {gridLayout.map((column, colIndex) => (
                          <div key={column.id} className="min-h-64">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                Column {colIndex + 1}
                              </Badge>
                              {gridLayout.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newLayout = gridLayout.filter((_, index) => index !== colIndex);
                                    setGridLayout(newLayout);
                                  }}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div
                              className="min-h-48 p-4 border-2 border-dashed border-slate-200 rounded-lg space-y-4"
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                
                                if (draggedSection) {
                                  // Move section to this column
                                  const newGridLayout = [...gridLayout];
                                  
                                  // Remove from current location
                                  newGridLayout.forEach(col => {
                                    col.sections = col.sections.filter((s: any) => s.id !== draggedSection.id);
                                  });
                                  
                                  // Add to target column
                                  newGridLayout[colIndex].sections.push(draggedSection);
                                  setGridLayout(newGridLayout);
                                  setDraggedSection(null);
                                }
                              }}
                            >
                              {column.sections.map((section: any, sectionIndex: number) => (
                                <Card key={section.id} className="border border-slate-300">
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className="h-4 w-4 text-slate-400 cursor-grab"
                                          draggable
                                          onDragStart={() => setDraggedSection(section)}
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>
                                        {getSectionIcon(section.type)}
                                        <Badge variant="outline" className="text-xs">
                                          {section.type.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingSection({ ...section, columnIndex: colIndex, sectionIndex });
                                            setEditingSectionIndex(sectionIndex);
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newGridLayout = [...gridLayout];
                                            newGridLayout[colIndex].sections.splice(sectionIndex, 1);
                                            setGridLayout(newGridLayout);
                                          }}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {renderSectionPreview(section)}
                                  </CardContent>
                                </Card>
                              ))}
                              
                              {column.sections.length === 0 && (
                                <div className="text-center py-8">
                                  <Type className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">
                                    Drag sections here or add new ones
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section Editor Modal */}
                {editingSection && (
                  <Card className="border-primary mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Edit {editingSection.type.replace('_', ' ')} Section
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={editingSection.title || ''}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            title: e.target.value
                          })}
                          placeholder="Enter section title"
                        />
                      </div>
                      
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={editingSection.content || ''}
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
                          onClick={() => {
                            const newSections = [...templateSections];
                            const index = newSections.findIndex(s => s.id === editingSection.id);
                            if (index !== -1) {
                              newSections[index] = editingSection;
                              setTemplateSections(newSections);
                            }
                            setEditingSection(null);
                          }}
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
                        <Label>Access Code</Label>
                        <div className="space-y-2">
                          {site?.accessCode ? (
                            <div>
                              <div className="flex gap-2">
                                <Input
                                  value={site.accessCode}
                                  readOnly
                                  className="flex-1 bg-slate-50"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(site.accessCode || '');
                                    toast({
                                      title: "Copied!",
                                      description: "Access code copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Users can register with this code to access the site
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await apiRequest(`/api/sites/${site?.id}/generate-access-code`, 'POST', {
                                      welcomeMessage: `Welcome to ${site?.name}! Please create your account to access your personalized content.`
                                    });
                                    const data = await response.json();
                                    
                                    // Refetch site to get updated access code
                                    queryClient.invalidateQueries({ queryKey: ['/api/sites', params?.id] });
                                    
                                    toast({
                                      title: "Access code generated!",
                                      description: "Users can now register with the access code",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to generate access code",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="w-full"
                              >
                                Generate Access Code
                              </Button>
                              <p className="text-xs text-muted-foreground mt-1">
                                Generate a unique code for user registration
                              </p>
                            </div>
                          )}
                        </div>
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