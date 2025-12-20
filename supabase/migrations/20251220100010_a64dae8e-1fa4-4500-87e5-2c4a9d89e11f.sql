-- Add DELETE policy for workspace_users table
-- Allow workspace owners and admins to remove workspace members

-- First, create a helper function to check if user is a workspace owner
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_users
    WHERE workspace_id = _workspace_id 
      AND user_id = _user_id 
      AND role = 'owner'
  )
$$;

-- Add DELETE policy for workspace_users
-- Only workspace owners can remove members (admins cannot remove other admins/owners)
CREATE POLICY "Workspace owners can remove members"
ON public.workspace_users
FOR DELETE
USING (is_workspace_owner(workspace_id, auth.uid()));
