import { getGroupDetails } from '@/app/actions/expense';
import GroupClientPage from './client-page';
import { createServer } from '@/lib/supabase-server';

export default async function DynamicGroupPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Guest mode: can't fetch on server, let client handle it
    return (
      <GroupClientPage 
        group={null} 
        participants={[]} 
        expenses={[]} 
        isGuest={true}
        groupId={id}
      />
    );
  }
  
  const { group, participants, expenses, error } = await getGroupDetails(id);

  if (error || !group) {
    // Could still be a legacy guest group or deleted, but for logged in users we expect DB data
    return (
      <GroupClientPage 
        group={null} 
        participants={[]} 
        expenses={[]} 
        isGuest={true}
        groupId={id}
      />
    );
  }

  return (
    <GroupClientPage 
      group={group} 
      participants={participants} 
      expenses={expenses} 
      isGuest={false}
      groupId={id}
    />
  );
}
