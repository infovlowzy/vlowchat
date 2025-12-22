-- Create a function to delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete user's workspace memberships (cascade will handle related data via ON DELETE CASCADE)
  DELETE FROM public.workspace_users WHERE user_id = current_user_id;
  
  -- Delete user's roles
  DELETE FROM public.user_roles WHERE user_id = current_user_id;
  
  -- Delete user's profile
  DELETE FROM public.profiles WHERE id = current_user_id;
  
  -- Delete user's quick replies
  DELETE FROM public.quick_replies WHERE user_id = current_user_id;
  
  -- Delete user's old chats
  DELETE FROM public.chats_old WHERE user_id = current_user_id;
  
  -- Delete user's transactions
  DELETE FROM public.transactions WHERE user_id = current_user_id;
  
  -- Finally, delete the user from auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;