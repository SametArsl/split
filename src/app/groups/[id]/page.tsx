// What? The Server Component wrapping the Client Component.
// Why? We fetch DB data securely on the server here and pass it down as props to the interactive Client page.
import { getGroupDetails } from '@/app/actions/expense';
import GroupClientPage from './client-page';
import { notFound } from 'next/navigation';

export default async function DynamicGroupPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const { group, participants, expenses, error } = await getGroupDetails(id);

  if (error || !group) {
    return notFound();
  }

  return (
    <GroupClientPage 
      group={group} 
      participants={participants} 
      expenses={expenses} 
    />
  );
}
