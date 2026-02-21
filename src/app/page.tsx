import { createServer } from '@/lib/supabase-server';
import { LandingPage } from '@/components/landing-page';

export default async function Home() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  // If we wanted to always redirect logged in users:
  // if (user) redirect('/groups');

  return <LandingPage />;
}
