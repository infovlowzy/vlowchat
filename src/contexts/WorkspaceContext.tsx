import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Workspace {
  id: string;
  name: string;
  whatsapp_phone_number: string | null;
  business_address: string | null;
  business_email: string | null;
  business_logo_url: string | null;
  currency_code: string | null;
  locale: string | null;
  timezone: string | null;
  created_at: string | null;
}

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  workspace: Workspace | null;
  isLoading: boolean;
  refetchWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspaceId: null,
  workspace: null,
  isLoading: true,
  refetchWorkspace: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspace = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Get user's workspace
      const { data: workspaceUser } = await supabase
        .from('workspace_users')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (workspaceUser?.workspace_id) {
        setCurrentWorkspaceId(workspaceUser.workspace_id);

        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceUser.workspace_id)
          .maybeSingle();

        if (workspaceData) {
          setWorkspace(workspaceData);
        }
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchWorkspace();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ 
      currentWorkspaceId, 
      workspace, 
      isLoading,
      refetchWorkspace: fetchWorkspace 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
