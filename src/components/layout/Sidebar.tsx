import { Home, MessageSquare, Receipt, Settings, ChevronLeft } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unreadChats: number;
  pendingTransactions: number;
}

export function Sidebar({ collapsed, onToggle, unreadChats, pendingTransactions }: SidebarProps) {
  const navItems = [
    { icon: Home, label: 'Home', path: '/', badge: undefined },
    { icon: MessageSquare, label: 'Chats', path: '/chats', badge: unreadChats },
    { icon: Receipt, label: 'Transactions', path: '/transactions', badge: pendingTransactions },
    { icon: Settings, label: 'Settings', path: '/settings', badge: undefined }
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col z-50',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Vlowzy AI"
                  className="w-5 h-5 object-contain rounded-lg"  {/* Changed from w-6 h-6 */}
                />
              </div>
            <div>
              <h1 className="font-semibold text-sm">Vlowchat AI</h1>
              <p className="text-xs text-muted-foreground">by Vlowzy</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              collapsed && 'justify-center'
            )}
            activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            <p>Powered by Vlowzy AI</p>
            <p className="mt-1">© 2025 All rights reserved</p>
          </div>
        )}
      </div>
    </aside>
  );
}
