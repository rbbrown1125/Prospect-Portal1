import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Users, FileText, Calendar, Search, Filter, Clock, User } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function ActivityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['/api/activity'],
  });

  const activities = Array.isArray(activitiesData) ? activitiesData : [];

  const activityTypeLabels = {
    site_created: "Site Created",
    prospect_added: "Prospect Added",
    site_updated: "Site Updated",
    prospect_updated: "Prospect Updated",
    file_uploaded: "File Uploaded",
    template_used: "Template Used"
  };

  const activityTypeIcons = {
    site_created: <FileText className="h-4 w-4" />,
    prospect_added: <Users className="h-4 w-4" />,
    site_updated: <FileText className="h-4 w-4" />,
    prospect_updated: <Users className="h-4 w-4" />,
    file_uploaded: <FileText className="h-4 w-4" />,
    template_used: <FileText className="h-4 w-4" />
  };

  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'site_created':
        return 'bg-green-100 text-green-800';
      case 'prospect_added':
        return 'bg-blue-100 text-blue-800';
      case 'site_updated':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect_updated':
        return 'bg-orange-100 text-orange-800';
      case 'file_uploaded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.activityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivityFilter = activityFilter === "all" || activity.activityType === activityFilter;
    
    const matchesDateFilter = dateFilter === "all" || (() => {
      const activityDate = new Date(activity.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today":
          return daysDiff === 0;
        case "week":
          return daysDiff <= 7;
        case "month":
          return daysDiff <= 30;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesActivityFilter && matchesDateFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
            <p className="text-slate-600">Track system activities and user actions</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="site_created">Site Created</SelectItem>
                  <SelectItem value="prospect_added">Prospect Added</SelectItem>
                  <SelectItem value="site_updated">Site Updated</SelectItem>
                  <SelectItem value="prospect_updated">Prospect Updated</SelectItem>
                  <SelectItem value="file_uploaded">File Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Sites Created</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a: any) => a.activityType === 'site_created').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Prospects Added</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a: any) => a.activityType === 'prospect_added').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Today</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a: any) => {
                    const activityDate = new Date(a.createdAt);
                    const now = new Date();
                    return activityDate.toDateString() === now.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activities</span>
            <Badge variant="secondary">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No activities found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters to see more results</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      {activityTypeIcons[activity.activityType as keyof typeof activityTypeIcons] || <Activity className="h-4 w-4" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getActivityBadgeColor(activity.activityType)}>
                        {activityTypeLabels[activity.activityType as keyof typeof activityTypeLabels] || activity.activityType}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy at h:mm a')}
                      </span>
                    </div>
                    
                    <p className="text-slate-900 font-medium mb-1">{activity.description}</p>
                    
                    {activity.metadata && (
                      <div className="text-sm text-slate-600">
                        {Object.entries(activity.metadata).map(([key, value]: [string, any]) => (
                          <span key={key} className="mr-4">
                            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center space-x-1 text-sm text-slate-500">
                      <User className="h-3 w-3" />
                      <span>User ID: {activity.userId.slice(0, 8)}...</span>
                    </div>
                    {activity.entityType && activity.entityId && (
                      <div className="text-xs text-slate-400 mt-1">
                        {activity.entityType}: {activity.entityId.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}