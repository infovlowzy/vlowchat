-- 1. Add DELETE policy for contacts table
CREATE POLICY "Users can delete contacts in their workspaces"
  ON public.contacts FOR DELETE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- 2. Update delete_user_account function to prevent orphaning workspaces
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  sole_owned_workspaces int;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is sole owner of any workspace
  SELECT COUNT(DISTINCT wu1.workspace_id)
  INTO sole_owned_workspaces
  FROM workspace_users wu1
  WHERE wu1.user_id = current_user_id
    AND wu1.role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM workspace_users wu2
      WHERE wu2.workspace_id = wu1.workspace_id
        AND wu2.user_id != current_user_id
        AND wu2.role = 'owner'
    );
  
  IF sole_owned_workspaces > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: you are the sole owner of % workspace(s). Transfer ownership or delete workspaces first.', sole_owned_workspaces;
  END IF;
  
  -- Safe to proceed - delete user data
  DELETE FROM public.workspace_users WHERE user_id = current_user_id;
  DELETE FROM public.user_roles WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;
  DELETE FROM public.quick_replies WHERE user_id = current_user_id;
  DELETE FROM public.chats_old WHERE user_id = current_user_id;
  DELETE FROM public.transactions WHERE user_id = current_user_id;
  
  -- Finally, delete the user from auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;