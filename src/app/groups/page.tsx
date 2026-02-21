import { getGroups } from '@/app/actions/group';
import { GroupsClientPage } from './client-page';
import { createServer } from '@/lib/supabase-server';

export default async function GroupsPage() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <GroupsClientPage initialGroups={[]} isGuest={true} />;
  }

  const groups = await getGroups();
  return <GroupsClientPage initialGroups={groups} isGuest={false} />;
}
