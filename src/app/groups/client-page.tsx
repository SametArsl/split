"use client"

import { getGroups } from '@/app/actions/group' 
import { NewGroupDialog } from '@/components/group/NewGroupDialog'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/context/language-context'
import { logout as authLogout } from '@/app/(auth)/login/actions'

export function GroupsClientPage({ initialGroups }: { initialGroups: any[] }) {
  const { t, language } = useLanguage()

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 sm:py-8 min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Bar for Global Actions */}
      <div className="flex justify-end items-center gap-2 mb-4">
        <LanguageToggle />
        <ThemeToggle />
        <form action={authLogout}>
          <Button variant="destructive" className="h-8 px-2 sm:h-9 sm:px-3 shadow-md">
            <LogOut className="w-4 h-4 mr-2" />
            {t('common.logout')}
          </Button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('groups.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('groups.description')}
          </p>
        </div>
        <div>
          <NewGroupDialog />
        </div>
      </div>

      {initialGroups.length === 0 ? (
        <div className="text-center py-10 sm:py-20 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <h3 className="mt-2 text-sm font-semibold text-foreground">{t('groups.no_groups')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('groups.no_groups_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {initialGroups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full bg-card dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-card-foreground">{group.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {new Date(group.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
