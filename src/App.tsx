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
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import { cn } from './lib/utils';
import { useChats } from './hooks/useChats';
import { useTransactions } from './hooks/useTransactions';

const queryClient = new QueryClient();

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: chats = [] } = useChats();
  const { data: transactions = [] } = useTransactions();
  
  const unreadChats = chats.filter(c => c.status === 'needs_action').length;
  const pendingTransactions = transactions.filter(t => t.status !== 'handled').length;

  return (
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
              <Route path="/auth" element={<Auth />} />
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
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
