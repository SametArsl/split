"use server"

// What? Server actions for creating and fetching groups.
// Why? Next.js App Router allows us to securely interact with the database from the server, avoiding exposing sensitive operations to the client.
import { createServer } from '@/lib/supabase-server';
import { groupSchema } from '@/lib/validations/group';
import { revalidatePath } from 'next/cache';

export async function createGroup(data: { name: string }) {
  const supabase = await createServer();
  
  // What? Validate the input using Zod before processing.
  // Why? Prevents malformed data from reaching the database.
  const parsed = groupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'errors.invalid_group_name' };
  }

  // What? Get the currently authenticated user.
  // Why? We need to assign `created_by` and automatically add them as a participant.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'errors.auth_required' };
  }

  // What? Insert the new group into the database.
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      created_by: user.id
    })
    .select()
    .single();

  if (groupError) {
    console.error('Group Creation DB Error:', groupError);
    return { error: 'errors.group_create_error' };
  }

  // What? Add the creator as the first participant of the group.
  // Why? Whoever creates the group should be in it by default.
  // Note: We use their saved full_name or email prefix as their default display name.
  const defaultName = user.user_metadata?.full_name 
    || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
  const { error: participantError } = await supabase
    .from('participants')
    .insert({
      group_id: group.id,
      user_id: user.id,
      display_name: defaultName
    });

  if (participantError) {
    console.error('Participant Creation DB Error:', participantError);
    return { error: 'errors.member_add_error' };
  }

  // What? Instruct Next.js to clear the cache for the groups page.
  // Why? Ensuring the newly created group shows up immediately without a manual refresh.
  revalidatePath('/groups');
  return { success: true, groupId: group.id };
}

export async function getGroups() {
  const supabase = await createServer();
  
  // What? Fetching all groups the current user has access to.
  // Why? To display them on the dashboard. RLS policies on Supabase will handle the actual filtering based on user ID.
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return data;
}
