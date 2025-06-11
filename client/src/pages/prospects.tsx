import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Eye, Calendar } from "lucide-react";

export default function Prospects() {
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
            <Button className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Prospect</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No prospects yet</h3>
            <p className="text-slate-600 mb-6">Add your first prospect to start sharing content and tracking engagement.</p>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Prospect
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
