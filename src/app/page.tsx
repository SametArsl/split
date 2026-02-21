import { redirect } from 'next/navigation';
import { createServer } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  redirect('/groups');
}
