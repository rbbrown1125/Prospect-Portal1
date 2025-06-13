import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Eye, Calendar, Edit, Trash2, Building, Phone } from "lucide-react";

export default function Prospects() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    status: 'active'
  });
  const { toast } = useToast();

  const { data: prospects, isLoading } = useQuery({
    queryKey: ['/api/prospects'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create prospect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospects'] });
      setShowAddModal(false);
      setFormData({ name: '', email: '', company: '', phone: '', notes: '', status: 'active' });
      toast({
        title: "Success",
        description: "Prospect added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add prospect",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update prospect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospects'] });
      setEditingProspect(null);
      setFormData({ name: '', email: '', company: '', phone: '', notes: '', status: 'active' });
      toast({
        title: "Success",
        description: "Prospect updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prospect",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/prospects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete prospect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prospects'] });
      toast({
        title: "Success",
        description: "Prospect deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prospect",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProspect) {
      updateMutation.mutate({ id: editingProspect.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (prospect: any) => {
    setEditingProspect(prospect);
    setFormData({
      name: prospect.name,
      email: prospect.email,
      company: prospect.company || '',
      phone: prospect.phone || '',
      notes: prospect.notes || '',
      status: prospect.status
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', company: '', phone: '', notes: '', status: 'active' });
    setEditingProspect(null);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
              <p className="text-slate-600 mt-1">Manage your prospect contacts and site access</p>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Prospect</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : prospects && prospects.length > 0 ? (
            <div className="grid gap-4">
              {prospects.map((prospect: any) => (
                <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{prospect.name}</h3>
                          <Badge variant={prospect.status === 'active' ? 'default' : 'secondary'}>
                            {prospect.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{prospect.email}</span>
                          </div>
                          {prospect.company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{prospect.company}</span>
                            </div>
                          )}
                          {prospect.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{prospect.phone}</span>
                            </div>
                          )}
                        </div>
                        {prospect.notes && (
                          <p className="text-sm text-slate-600 mt-2">{prospect.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>Added {new Date(prospect.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prospect)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(prospect.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No prospects yet</h3>
              <p className="text-slate-600 mb-6">Add your first prospect to start sharing content and tracking engagement.</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Prospect
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProspect ? 'Edit Prospect' : 'Add New Prospect'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProspect ? 'Update' : 'Add'} Prospect
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
