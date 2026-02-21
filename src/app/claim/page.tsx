// What? Route to handle user claiming their ghost profile.
// Why? Ensures that if my friend added me as "Ahmet" before I signed up, I can link my actual new account to that "Ahmet" and retain connection to my debts.
import { createServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  const { token } = await searchParams;
  if (!token) return redirect('/groups');

  const supabase = await createServer();
  
  // 1. Is user logged in?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Force them to log in / sign up first
    return redirect(`/login?redirect=/claim?token=${token}`);
  }

  // 2. Find the ghost participant record matching the token
  const { data: participant, error: fetchError } = await supabase
    .from('participants')
    .select('*')
    .eq('invite_token', token)
    .is('user_id', null)
    .single();

  if (fetchError || !participant) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-4">
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Geçersiz Link</h2>
          <p>Öyle bir davet bulunamadı veya daha önceden kullanılmış olabilir.</p>
          <Button asChild className="mt-4"><a href="/groups">Ana Sayfaya Dön</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center text-center p-4">
      <div className="max-w-md p-6 border rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Hoş Geldiniz!</h2>
        <p className="mb-6 text-gray-600">
          <strong>{participant.display_name}</strong> isimli katılımcı profilini hesabınızla eşleştirmek istiyor musunuz?
        </p>
        <form action={async () => {
          "use server"
          const supabaseSrv = await createServer();
          
          // What? The actual link/resolution process. We fill the user_id and nullify the token.
          await supabaseSrv
            .from('participants')
            .update({ 
               user_id: user.id,
               invite_token: null 
            })
            .eq('id', participant.id);
            
          redirect(`/groups/${participant.group_id}`);
        }}>
          <Button type="submit" size="lg" className="w-full">Profili Benimle Eşleştir</Button>
        </form>
      </div>
    </div>
  );
}
