import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  List, 
  Inbox, 
  Upload, 
  Menu, 
  X,
  ChevronRight,
  Sun,
  Moon,
  Box,
  Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: List },
  { path: '/heatmap', label: 'AI Heatmap', icon: Sparkles, highlight: true },
  { path: '/requests', label: 'Requests', icon: Inbox },
  { path: '/import', label: 'Import', icon: Upload },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Dashboard';
    if (path === '/inventory') return 'Application Inventory';
    if (path.startsWith('/applications/')) return 'Application Detail';
    if (path === '/heatmap') return 'AI Portfolio Heatmap';
    if (path === '/requests') return 'Requests Center';
    if (path === '/import') return 'Import Data';
    return '';
  };

  return (
    <div className="min-h-screen relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 sidebar-glass
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--glass-border)]">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-theme-primary text-lg leading-tight tracking-tight">
                BIA
              </h1>
              <p className="text-xs text-theme-muted -mt-0.5">Blox App Inventory</p>
            </div>
            <button 
              className="lg:hidden ml-auto p-2 hover:bg-[var(--glass-highlight)] rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-theme-muted" />
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
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive 
                      ? item.highlight 
                        ? 'bg-purple-500/15 text-purple-400' 
                        : 'bg-green-500/15 text-green-500' 
                      : item.highlight
                        ? 'text-purple-400/80 hover:bg-purple-500/10 hover:text-purple-400'
                        : 'text-theme-secondary hover:bg-[var(--glass-highlight)] hover:text-theme-primary'
                    }
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${item.highlight ? 'bg-purple-500' : 'bg-green-500'} rounded-r-full`} />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? (item.highlight ? 'text-purple-400' : 'text-green-500') : (item.highlight ? 'text-purple-400/70' : 'group-hover:text-green-500/70')}`} />
                  {item.label}
                  {isActive && (
                    <ChevronRight className={`w-4 h-4 ml-auto ${item.highlight ? 'text-purple-500/50' : 'text-green-500/50'}`} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & Footer */}
          <div className="p-4 border-t border-[var(--glass-border)]">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--glass-highlight)] hover:bg-[var(--glass-bg)] transition-colors text-theme-secondary hover:text-theme-primary"
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">Dark Mode</span>
                </>
              )}
            </button>
            <div className="mt-3 px-4 py-2 text-center">
              <p className="text-[10px] text-theme-faint">BIA v1.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 header-blur">
          <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <button 
              className="lg:hidden p-2 -ml-2 hover:bg-[var(--glass-highlight)] rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5 text-theme-muted" />
            </button>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-theme-muted">BIA</span>
              <ChevronRight className="w-4 h-4 hidden sm:block text-theme-faint" />
              <span className="font-medium text-theme-primary">{getBreadcrumb()}</span>
            </div>

            {/* Live indicator */}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-theme-muted hidden sm:inline">Live</span>
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
