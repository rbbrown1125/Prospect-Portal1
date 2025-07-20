import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, UserPlus, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

interface QuickActionsProps {
  onCreateSite: () => void;
}

export default function QuickActions({ onCreateSite }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const actions = [
    {
      icon: Plus,
      title: "Create New Site",
      description: "Start with a template",
      onClick: onCreateSite,
      bgColor: "bg-primary/10 group-hover:bg-primary/20",
      iconColor: "text-primary",
    },
    {
      icon: Upload,
      title: "Upload Content",
      description: "Add new materials",
      onClick: () => setLocation("/content"),
      bgColor: "bg-success/10 group-hover:bg-success/20",
      iconColor: "text-success",
    },
    {
      icon: UserPlus,
      title: "Add Prospect",
      description: "Invite new contacts",
      onClick: () => setLocation("/prospects"),
      bgColor: "bg-purple-100 group-hover:bg-purple-200",
      iconColor: "text-purple-600",
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description: "Track engagement",
      onClick: () => setLocation("/analytics"),
      bgColor: "bg-orange-100 group-hover:bg-orange-200",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start p-4 h-auto border border-slate-200 hover:border-slate-300 group"
            onClick={action.onClick}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center transition-colors`}>
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-slate-900">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
