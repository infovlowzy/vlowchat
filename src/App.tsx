import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import Home from './pages/Home';
import Chats from './pages/Chats';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { mockChats, mockTransactions } from './lib/mockData';
import { cn } from './lib/utils';

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const unreadChats = mockChats.filter(c => c.status === 'needs_action').length;
  const pendingTransactions = mockTransactions.filter(t => t.status !== 'handled').length;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background flex">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              unreadChats={unreadChats}
              pendingTransactions={pendingTransactions}
            />
            <main
              className={cn(
                'flex-1 p-8 transition-all duration-300',
                sidebarCollapsed ? 'ml-16' : 'ml-60'
              )}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
