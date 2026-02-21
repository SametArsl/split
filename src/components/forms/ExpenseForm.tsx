"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormValues } from '@/lib/validations/expense';
import { addExpense, updateExpense } from '@/app/actions/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/store/ui-store';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/context/language-context';
import { guestStorage } from '@/lib/guest-storage';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox"
import { Check, Users, ChevronDown } from 'lucide-react';

export function ExpenseForm({ groupId, participants, isGuest }: { groupId: string, participants: any[], isGuest?: boolean }) {
  const { setExpenseModalOpen, editingExpense, setEditingExpense } = useUiStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    editingExpense?.splits?.map((s: any) => s.participant_id) || participants.map(p => p.id)
  );

  const isEditMode = !!editingExpense;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: editingExpense?.description || '',
      amount: editingExpense ? editingExpense.amount / 100 : undefined,
      currency: (editingExpense?.currency || 'TRY') as "TRY" | "USD" | "EUR", 
      payerId: editingExpense?.payer_id || participants[0]?.id || '',
    },
  });

  useEffect(() => {
    if (editingExpense) {
      form.reset({
        description: editingExpense.description,
        amount: editingExpense.amount / 100,
        currency: (editingExpense.currency || 'TRY') as any,
        payerId: editingExpense.payer_id || participants[0]?.id,
      });
      setSelectedParticipants(editingExpense.splits?.map((s: any) => s.participant_id) || participants.map(p => p.id));
    } else {
      form.reset({
        description: '',
        amount: undefined,
        currency: 'TRY' as any,
        payerId: participants[0]?.id || '',
      });
      setSelectedParticipants(participants.map(p => p.id));
    }
  }, [editingExpense, form, participants]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev: string[]) => 
      prev.includes(id) 
        ? prev.length > 1 ? prev.filter((p: string) => p !== id) : prev
        : [...prev, id]
    );
  };

  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
        if (isGuest) {
            return guestStorage.addExpense(groupId, {
                description: data.description,
                amount: Math.round(data.amount * 100),
                currency: data.currency,
                payer_id: data.payerId,
                splits: data.splits?.map((s: any) => ({
                    participant_id: s.participantId,
                    amount_owed: s.amountOwed
                })) || []
            });
        }
        return await addExpense(groupId, data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
    onSuccess: (result: any) => {
      if (result?.error) {
         alert(t(result.error));
      } else {
        form.reset();
        setExpenseModalOpen(false);
      }
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
        if (isGuest) {
            return guestStorage.updateExpense(groupId, editingExpense.id, {
                description: data.description,
                amount: Math.round(data.amount * 100),
                currency: data.currency,
                payer_id: data.payerId,
                splits: data.splits?.map((s: any) => ({
                    participant_id: s.participantId,
                    amount_owed: s.amountOwed
                })) || []
            });
        }
        return await updateExpense(groupId, editingExpense.id, data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
    onSuccess: (result: any) => {
      if (result?.error) {
         alert(t(result.error));
      } else {
        form.reset();
        setEditingExpense(null);
        setExpenseModalOpen(false);
      }
    }
  });

  async function onSubmit(data: ExpenseFormValues) {
    const amountInCents = Math.round(data.amount * 100);
    const splitAmount = Math.round(amountInCents / selectedParticipants.length);
    
    // Construct splits array
    data.splits = selectedParticipants.map((pid: string) => ({
        participantId: pid,
        amountOwed: splitAmount / 100 // Send as float for schema
    }));

    if (isEditMode) {
      updateExpenseMutation.mutate(data);
    } else {
      addExpenseMutation.mutate(data);
    }
  }

  const isPending = addExpenseMutation.isPending || updateExpenseMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold">{t('forms.expense_description')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.expense_placeholder')} {...field} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-foreground font-semibold">{t('forms.amount')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-lg font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="w-[110px] sm:w-[130px]">
                <FormLabel className="text-foreground font-semibold">{t('forms.currency')}</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:text-slate-100" 
                    {...field}
                  >
                    <option value="TRY">₺ TRY</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="payerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold">{t('forms.payer')}</FormLabel>
              <FormControl>
                <select 
                  className="w-full h-12 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-medium" 
                  {...field}
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-foreground font-semibold flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              {t('forms.who_will_pay')}
            </FormLabel>
            <button 
              type="button"
              onClick={() => setSelectedParticipants(participants.map(p => p.id))}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {t('common.select_all')}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 scrollbar-hide border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
            {participants.map(p => {
              const isSelected = selectedParticipants.includes(p.id);
              return (
                <div 
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group",
                    isSelected
                      ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 shadow-sm"
                      : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Checkbox 
                    id={`form-participant-${p.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleParticipant(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {p.display_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-[0.98] mt-2" 
          disabled={isPending}
        >
          {isPending 
            ? t('forms.saving') 
            : isEditMode ? t('common.save') : t('common.add')}
        </Button>
      </form>
    </Form>
  );
}
