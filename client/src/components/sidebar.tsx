import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Users, 
  Settings,
  Share,
  Shield
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Sites", href: "/sites", icon: Globe },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Content Library", href: "/content", icon: FolderOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Prospects", href: "/prospects", icon: Users },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Add admin navigation for admin users
  const navigationItems = [...navigation];
  if ((user as any)?.role === 'admin') {
    navigationItems.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Share className="text-white h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">ProspectShare</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.name === "My Sites" && (
                    <span className="ml-auto bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">
                      12
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <img
            src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
            alt="User profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).email : 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {(user as any)?.role === 'admin' ? 'Administrator' : 'Sales Manager'}
            </p>
          </div>
          <button
            onClick={() => setLocation("/profile")}
            className="text-slate-400 hover:text-slate-600"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
