"use client"

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { useTranslation } from '@/context/language-context'
import { Button } from './button'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

export function Navbar({ user }: { user: any }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify-email'
  
  if (isAuthPage) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image 
            src="/logo.png" 
            alt="FairSplit Logo" 
            width={40} 
            height={40} 
            priority
            className="h-9 w-auto group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-xl font-extrabold tracking-tighter text-foreground group-hover:text-blue-600 transition-colors duration-300">
            FairSplit
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <Link href="/groups">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "hidden sm:flex items-center gap-2",
                  pathname === '/groups' && "bg-accent text-accent-foreground"
                )}
              >
                <LayoutDashboard size={18} />
                {t('navbar.groups')}
              </Button>
            </Link>
          )}

          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {user ? (
            <form action={logout}>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" title={t('common.logout')}>
                <LogOut size={20} />
              </Button>
            </form>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">{t('navbar.login')}</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t('navbar.register')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
