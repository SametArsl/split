"use client"

// What? The Client Component for the group details page.
// Why? Needs React Hooks (useState for UI, Zustand for Modals) and event listeners which Server Components can't do.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useLanguage } from '@/context/language-context';
import { useUiStore } from '@/store/ui-store';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, fromCents } from '@/utils/currency';
import { calculateSplit, Balance } from '@/utils/calculateSplit';
import { addGhostUser, getGroupDetails, removeParticipant, removeExpense } from '@/app/actions/expense';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function GroupClientPage(props: { group: any, participants: any[], expenses: any[] }) {
  const { group, participants: initialParticipants, expenses: initialExpenses } = props;
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isExpenseModalOpen, setExpenseModalOpen, setEditingExpense, editingExpense } = useUiStore();
  const [ghostName, setGhostName] = useState('');
  const queryClient = useQueryClient();

  // What? Using React Query with initialData from our Server Component fetch.
  // Why? Allows us to perform optimistic updates on the client without losing SEO/Initial Load speed.
  const { data: groupData } = useQuery({
    queryKey: ['group', group.id],
    queryFn: async () => {
      const { participants, expenses } = await getGroupDetails(group.id);
      return { participants, expenses };
    },
    initialData: { participants: initialParticipants, expenses: initialExpenses }
  });

  const participants = groupData.participants;
  const expenses = groupData.expenses;

  // What? Calculate debts locally based on fetched expenses
  // Why? Instead of a complex SQL view, we build the balances array and use our pure function `calculateSplit`.
  // We now group everything by currency for Multi-Currency support.
  const currencies = ['TRY', 'USD', 'EUR'] as const;
  
  // balancesMap[currency][participantId] = netBalance
  const balancesMap: Record<string, Record<string, number>> = {};
  currencies.forEach(c => {
    balancesMap[c] = {};
    participants.forEach(p => balancesMap[c][p.id] = 0);
  });

  expenses.forEach(exp => {
    const currency = exp.currency || 'TRY';
    if (!balancesMap[currency]) return;

    // The payer gets credited (+)
    if (balancesMap[currency][exp.payer_id] !== undefined) {
      balancesMap[currency][exp.payer_id] += exp.amount;
    }
    
    // Everyone involved in the split gets debited (-)
    if (exp.splits) {
      exp.splits.forEach((split: any) => {
         if (balancesMap[currency][split.participant_id] !== undefined) {
           balancesMap[currency][split.participant_id] -= split.amount_owed;
         }
      });
    }
  });

  // What? Run the split algorithm for each currency independently.
  const settlementsByCurrency: Record<string, any[]> = {};
  currencies.forEach(c => {
    const balancesArray: Balance[] = participants.map(p => ({
      participantId: p.id,
      netBalance: balancesMap[c][p.id]
    }));
    settlementsByCurrency[c] = calculateSplit(balancesArray);
  });

  const totalSettlementsCount = Object.values(settlementsByCurrency).reduce((sum, s) => sum + s.length, 0);

  // What? useMutation for Ghost User creation with optimistic update
  const addGhostMutation = useMutation({
    mutationFn: async (name: string) => await addGhostUser(group.id, name),
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: ['group', group.id] });
      const previousData = queryClient.getQueryData(['group', group.id]);

      // Optimistically append the new ghost user
      if (previousData) {
        queryClient.setQueryData(['group', group.id], (old: any) => ({
          ...old,
          participants: [
            ...old.participants, 
            { id: Math.random().toString(), display_name: newName, group_id: group.id, user_id: null }
          ],
        }));
      }
      return { previousData };
    },
    onError: (err, newName, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['group', group.id], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
    }
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => await removeParticipant(group.id, participantId),
    onMutate: async (participantId) => {
      await queryClient.cancelQueries({ queryKey: ['group', group.id] });
      const previousData = queryClient.getQueryData(['group', group.id]);

      if (previousData) {
        queryClient.setQueryData(['group', group.id], (old: any) => ({
          ...old,
          participants: old.participants.filter((p: any) => p.id !== participantId),
        }));
      }
      return { previousData };
    },
    onError: (err, participantId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['group', group.id], context.previousData);
      }
      alert(t('group_details.participant_delete_error'));
    },
    onSuccess: (result, participantId, context) => {
      // What? Server Actions return 200 OK even when they fail internally and return `{ error: '...' }`
      if (result?.error) {
        // Rollback optimistic update
        if (context?.previousData) {
          queryClient.setQueryData(['group', group.id], context.previousData);
        }
        alert(t(result.error));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
    }
  });

  const removeExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => await removeExpense(group.id, expenseId),
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: ['group', group.id] });
      const previousData = queryClient.getQueryData(['group', group.id]);

      if (previousData) {
        queryClient.setQueryData(['group', group.id], (old: any) => ({
          ...old,
          expenses: old.expenses.filter((e: any) => e.id !== expenseId),
        }));
      }
      return { previousData };
    },
    onError: (err, expenseId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['group', group.id], context.previousData);
      }
      alert(t('group_details.expense_delete_error'));
    },
    onSuccess: (result, expenseId, context) => {
      if (result?.error) {
        if (context?.previousData) {
          queryClient.setQueryData(['group', group.id], context.previousData);
        }
        alert(t(result.error));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
    }
  });

  const handleAddGhost = async () => {
    if (!ghostName.trim()) return;
    addGhostMutation.mutate(ghostName);
    setGhostName('');
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8 bg-background text-foreground transition-colors duration-300 min-h-screen">
      
      <div className="flex flex-row items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
        <Button 
           variant="ghost" 
           size="sm" 
           onClick={() => router.back()}
           className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 -ml-2 px-2 sm:px-3 h-8 sm:h-9"
        >
          <ArrowLeft className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.back')}</span>
        </Button>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <nav className="flex items-center text-sm font-medium text-slate-500 overflow-hidden">
          <Link href="/groups" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
            {t('common.home')}
          </Link>
          <ChevronRight className="w-4 h-4 mx-0.5 sm:mx-1 text-slate-400 shrink-0" />
          <span className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md truncate max-w-[150px] sm:max-w-none">{group.name}</span>
        </nav>
      </div>

      {/* Group Header */}
      <div className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(group.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                year: "numeric",
                month: "long",
                day: "numeric",
              })} {t('groups.created_at')}
            </p>
          </div>
          <div className="flex-shrink-0">
            <h3 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">{t('group_details.add_ghost')}</h3>
            <div className="flex gap-2 max-w-sm">
              <input 
                className="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={t('group_details.ghost_placeholder')} 
                value={ghostName}
                onChange={e => setGhostName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGhost()}
              />
              <Button size="sm" variant="secondary" onClick={handleAddGhost}>{t('common.add')}</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{t('group_details.participants')}:</span>
          <ul className="gap-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {participants.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between bg-muted/50 dark:bg-slate-800/50 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md border border-border text-xs sm:text-sm w-full text-foreground">
                <span className="truncate mr-1">{p.display_name}</span>
                {/* Ne? Silme butonu - Sadece ghost user'lar silinebilir diyebiliriz ama dökümanda sınır verilmediği için herkesi sililebilir yapıyoruz */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 ml-4 font-bold border border-red-200 dark:border-red-900 shadow-sm bg-white dark:bg-slate-800"
                  onClick={() => {
                     if (window.confirm(t('common.confirm_delete'))) {
                        removeParticipantMutation.mutate(p.id);
                     }
                  }} 
                  aria-label={t('common.delete')}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Settlements / Debts UI (Borç Sadeleştirme) */}
      <div className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-foreground">{t('group_details.settlements_title')}</h2>
        {totalSettlementsCount === 0 ? (
          <p className="text-muted-foreground">{t('group_details.no_debts')}</p>
        ) : (
          <div className="space-y-6">
            {currencies.map(currency => {
              const currencySettlements = settlementsByCurrency[currency] || [];
              if (currencySettlements.length === 0) return null;

              return (
                <div key={currency} className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 border-l-4 border-blue-500 dark:border-blue-700 pl-3 py-1 bg-blue-50/50 dark:bg-blue-900/10 text-slate-700 dark:text-slate-200">
                    <span className="opacity-70">{currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}</span>
                    {currency} {t('group_details.currency_debts')}
                  </h3>
                  <ul className="space-y-3">
                    {currencySettlements.map((tx, idx) => {
                      const fromName = participants.find(p => p.id === tx.from)?.display_name;
                      const toName = participants.find(p => p.id === tx.to)?.display_name;
                      return (
                        <li key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 rounded-md gap-2 border border-red-100 dark:border-red-900/30">
                          <span className="text-sm sm:text-base"><strong>{fromName}</strong> ➡️ <strong>{toName}</strong> {t('group_details.pays_to')}</span>
                          <span className="font-bold text-base sm:text-lg">{formatCurrency(tx.amount, language === 'tr' ? 'tr-TR' : 'en-US', currency)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expenses List */}
      <div className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t('group_details.expenses_title')}</h2>
          <Button onClick={() => {
            setEditingExpense(null);
            setExpenseModalOpen(true);
          }}>
            {t('group_details.new_expense')}
          </Button>
        </div>

        {expenses.length === 0 ? (
           <p className="text-muted-foreground">{t('group_details.no_expenses')}</p>
        ) : (
           <div className="space-y-4">
              {expenses.map((exp: any) => (
                <div key={exp.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm gap-4">
                  <div className="flex-1 min-w-0">
                     <p className="font-semibold truncate text-foreground">{exp.description}</p>
                     <p className="text-xs sm:text-sm text-muted-foreground truncate">{t('group_details.paid_by')}: {exp.payer?.display_name}</p>
                  </div>
                   <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="font-bold text-lg text-foreground">
                      {formatCurrency(exp.amount, language === 'tr' ? 'tr-TR' : 'en-US', exp.currency || 'TRY')}
                    </div>
                    <div className="flex gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setEditingExpense(exp);
                       setExpenseModalOpen(true);
                     }}
                     className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                   >
                     {t('common.edit')}
                   </Button>
                   <Button
                     variant="destructive"
                     size="sm"
                     onClick={() => {
                       if (window.confirm(t('common.confirm_delete'))) {
                         removeExpenseMutation.mutate(exp.id);
                       }
                     }}
                   >
                     {t('common.delete')}
                    </Button>
                  </div>
                   </div>
                </div>
              ))}

              {/* Multi-Currency Totals inside the Expense box */}
              <div className="p-4 bg-card dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mt-4 rounded-md shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('group_details.total_expense')}</span>
                  <div className="flex flex-col items-end gap-1">
                    {currencies.map(currency => {
                      const total = expenses
                        .filter((exp: any) => (exp.currency || 'TRY') === currency)
                        .reduce((sum: number, exp: any) => sum + exp.amount, 0);
                      
                      if (total === 0) return null;

                      return (
                        <span key={currency} className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                          {formatCurrency(total, language === 'tr' ? 'tr-TR' : 'en-US', currency)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
           </div>
        )}
      </div>

      <Dialog open={isExpenseModalOpen} onOpenChange={(open) => {
        setExpenseModalOpen(open);
        if (!open) setEditingExpense(null);
      }}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingExpense ? t('forms.editing') : t('group_details.new_expense')}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm groupId={group.id} participants={participants} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
