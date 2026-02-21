"use client"

import { login } from '@/app/(auth)/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useTranslation } from '@/context/language-context';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function LoginContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const rawError = searchParams.get('error');
  const error = rawError ? t(rawError) : null;

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-background text-foreground transition-colors duration-300 relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('auth.login_title')}</h1>
          <p className="text-muted-foreground">{t('auth.login_subtitle')}</p>
        </div>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
            <Input id="email" name="email" type="email" required className="dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
            <Input id="password" name="password" type="password" required className="dark:bg-slate-800 dark:border-slate-700" />
          </div>
          
          <div className="pt-4">
            <Button formAction={login} className="w-full">{t('auth.login')}</Button>
          </div>
          
          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">{t('auth.no_account')}</span> <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">{t('auth.register')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
