import { getGroups } from '@/app/actions/group';
import { GroupsClientPage } from './client-page';

// What? The main dashboard page displaying a list of all groups the user belongs to.
// Why? It acts as the central hub after login. It's a Server Component, so it fetches data directly from the DB on the server before rendering.
export default async function GroupsPage() {
  const groups = await getGroups();

  return <GroupsClientPage initialGroups={groups} />;
}
