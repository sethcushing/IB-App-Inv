import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  List, 
  Inbox, 
  Upload, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Building2
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: List },
  { path: '/requests', label: 'Requests', icon: Inbox },
  { path: '/import', label: 'Import', icon: Upload },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Dashboard';
    if (path === '/inventory') return 'Application Inventory';
    if (path.startsWith('/applications/')) return 'Application Detail';
    if (path === '/requests') return 'Requests Center';
    if (path === '/import') return 'Import Data';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 
        transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-zinc-900 text-lg leading-tight">Systems</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Inventory Dashboard</p>
            </div>
            <button 
              className="lg:hidden ml-auto p-1 hover:bg-slate-100 rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isActive 
                      ? 'bg-lime-500/10 text-zinc-900 border-l-4 border-lime-500 -ml-px pl-[11px]' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-zinc-900'
                    }
                  `}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-lime-600' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                  data-testid="user-menu-trigger"
                >
                  <Avatar className="h-8 w-8 bg-zinc-900">
                    <AvatarFallback className="bg-zinc-900 text-white text-xs font-medium">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <button 
              className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline">Home</span>
              <ChevronRight className="w-4 h-4 hidden sm:block" />
              <span className="font-medium text-zinc-900">{getBreadcrumb()}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
