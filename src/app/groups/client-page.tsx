"use client"

import { useState, useEffect } from 'react'
import { NewGroupDialog } from '@/components/group/NewGroupDialog'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { useLanguage } from '@/context/language-context'
import { guestStorage, GuestGroup } from '@/lib/guest-storage'

export function GroupsClientPage({ initialGroups, isGuest }: { initialGroups: any[], isGuest: boolean }) {
  const { t, language } = useLanguage()
  const [groups, setGroups] = useState<any[]>(initialGroups)

  useEffect(() => {
    if (isGuest) {
      setGroups(guestStorage.getGroups())
    }
  }, [isGuest])

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 sm:py-8 min-h-screen transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isGuest ? (
              <span className="flex items-center gap-2">
                {t('groups.title')}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  Guest Mode
                </span>
              </span>
            ) : t('groups.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('groups.description')}
          </p>
        </div>
        <div>
          <NewGroupDialog isGuest={isGuest} />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-10 sm:py-20 border-2 border-dashed rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <h3 className="mt-2 text-sm font-semibold text-foreground">{t('groups.no_groups')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('groups.no_groups_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full bg-card dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden">
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
