"use client"

import { useState, useEffect, useMemo } from 'react'
import { NewGroupDialog } from '@/components/group/NewGroupDialog'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/context/language-context'
import { guestStorage } from '@/lib/guest-storage'
import { deleteGroup } from '@/app/actions/group'
import { Trash2, Calendar, Clock, Archive } from 'lucide-react'

export function GroupsClientPage({ initialGroups, isGuest }: { initialGroups: any[], isGuest: boolean }) {
  const { t, language } = useLanguage()
  const [groups, setGroups] = useState<any[]>(initialGroups)

  useEffect(() => {
    if (isGuest) {
      setGroups(guestStorage.getGroups())
    }
  }, [isGuest])

  const handleDelete = async (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!window.confirm(t('common.confirm_delete_group'))) return

    if (isGuest) {
      guestStorage.deleteGroup(groupId)
      setGroups(guestStorage.getGroups())
    } else {
      const result = await deleteGroup(groupId)
      if (result.success) {
        setGroups(prev => prev.filter(g => g.id !== groupId))
      } else {
        alert(t(result.error || 'errors.group_delete_error'))
      }
    }
  }

  const { activeGroups, pastGroups } = useMemo(() => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    return groups.reduce((acc, group) => {
      const createdAt = new Date(group.created_at)
      if (createdAt > oneMonthAgo) {
        acc.activeGroups.push(group)
      } else {
        acc.pastGroups.push(group)
      }
      return acc
    }, { activeGroups: [] as any[], pastGroups: [] as any[] })
  }, [groups])

  const renderGroupList = (groupList: any[], title?: string, icon?: React.ReactNode) => (
    <div className="mb-10 lg:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {title && (
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent ml-2" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {groupList.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`} className="group relative">
            <Card className="hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full bg-card dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden group-hover:border-blue-500/50">
              <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <Calendar className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, group.id)}
                    className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl font-bold text-card-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                  {group.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground font-medium text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(group.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:py-12 min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6 bg-slate-50/50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex flex-col sm:flex-row items-center gap-3">
            {t('groups.title')}
            {isGuest && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/10">
                GUEST
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md font-medium">
            {t('groups.description')}
          </p>
        </div>
        <div className="shrink-0 scale-110 sm:scale-125 mx-auto sm:mx-0">
          <NewGroupDialog isGuest={isGuest} />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 sm:py-32 border-2 border-dashed rounded-[3rem] bg-slate-50/20 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
           <div className="inline-flex p-6 rounded-[2rem] bg-slate-100 dark:bg-slate-800 mb-6 text-slate-400">
             <LayoutGrid className="h-10 w-10" />
           </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t('groups.no_groups')}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">
            {t('groups.no_groups_desc')}
          </p>
        </div>
      ) : (
        <>
          {activeGroups.length > 0 && renderGroupList(activeGroups)}
          {pastGroups.length > 0 && renderGroupList(pastGroups, t('groups.past_groups'), <Archive className="h-5 w-5" />)}
        </>
      )}
    </div>
  )
}

function LayoutGrid(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}
