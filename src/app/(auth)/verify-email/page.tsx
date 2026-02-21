import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl font-bold">E-postanızı Doğrulayın</h1>
        <p className="text-muted-foreground w-full">
          Size bir doğrulama e-postası gönderdik. Hesabınızı aktifleştirmek ve uygulamayı kullanmaya başlamak için lütfen gelen kutunuzu (veya Spam klasörünü) kontrol edip onay linkine tıklayın.
        </p>
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/login">Giriş Ekranına Dön</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
