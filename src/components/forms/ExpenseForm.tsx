"use client"

// What? Client component for submitting a new expense.
import { useState } from 'react';
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
import { useEffect } from 'react';
import { useTranslation } from '@/context/language-context';

export function ExpenseForm({ groupId, participants }: { groupId: string, participants: any[] }) {
  const { setExpenseModalOpen, editingExpense, setEditingExpense } = useUiStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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

  // What? Reset form when editingExpense changes (e.g., clicking edit on another expense)
  useEffect(() => {
    if (editingExpense) {
      form.reset({
        description: editingExpense.description,
        amount: editingExpense.amount / 100,
        currency: (editingExpense.currency || 'TRY') as any,
        payerId: editingExpense.payer_id || participants[0]?.id,
      });
    } else {
      form.reset({
        description: '',
        amount: undefined,
        currency: 'TRY' as any,
        payerId: participants[0]?.id || '',
      });
    }
  }, [editingExpense, form, participants]);

  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => await addExpense(groupId, data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['group', groupId] });
      const previousData = queryClient.getQueryData(['group', groupId]);

      if (previousData) {
        queryClient.setQueryData(['group', groupId], (old: any) => ({
          ...old,
          expenses: [
            {
              id: Math.random().toString(),
              description: newExpense.description,
              amount: newExpense.amount * 100, // naive conversion strictly for optimistic UI
              currency: newExpense.currency,
              group_id: groupId,
              payer_id: newExpense.payerId,
              payer: participants.find(p => p.id === newExpense.payerId) || { display_name: 'Unknown' },
              created_at: new Date().toISOString()
            },
            ...(old.expenses || []) // Prepend assuming newest first
          ]
        }));
      }
      return { previousData };
    },
    onError: (err, newExpense, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['group', groupId], context.previousData);
      }
      alert(t('common.error'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
    onSuccess: (result) => {
      if (result?.error) {
         alert(t(result.error));
      } else {
        form.reset();
        setExpenseModalOpen(false);
      }
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => await updateExpense(groupId, editingExpense.id, data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['group', groupId] });
      const previousData = queryClient.getQueryData(['group', groupId]);

      if (previousData) {
        queryClient.setQueryData(['group', groupId], (old: any) => {
          const amountInCents = Math.round(newExpense.amount * 100);
          const splitAmount = old.participants && old.participants.length > 0
            ? Math.round(amountInCents / old.participants.length)
            : 0;
            
          return {
            ...old,
            expenses: old.expenses.map((exp: any) => 
              exp.id === editingExpense.id 
                ? {
                    ...exp,
                    description: newExpense.description,
                    amount: amountInCents,
                    currency: newExpense.currency,
                    payer_id: newExpense.payerId,
                    payer: participants.find(p => p.id === newExpense.payerId) || exp.payer,
                    // Optimistically recalculate equal splits
                    splits: old.participants.map((p: any) => ({
                      expense_id: exp.id,
                      participant_id: p.id,
                      amount_owed: splitAmount
                    }))
                  }
                : exp
            )
          };
        });
      }
      return { previousData };
    },
    onError: (err, newExpense, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['group', groupId], context.previousData);
      }
      alert(t('common.error'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
    onSuccess: (result) => {
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
    if (isEditMode) {
      updateExpenseMutation.mutate(data);
    } else {
      addExpenseMutation.mutate(data);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setExpenseModalOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => setEditingExpense(null), 200); // Clear on close animation end
    }
  };

  const isPending = addExpenseMutation.isPending || updateExpenseMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.expense_description')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.expense_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-end gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t('forms.amount')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                    className="text-base"
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
              <FormItem className="w-[100px] sm:w-[120px]">
                <FormLabel>{t('forms.currency')}</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-2 sm:px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100" 
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
              <FormLabel>{t('forms.payer')}</FormLabel>
              <FormControl>
                <select 
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-transparent dark:bg-slate-800 dark:text-slate-100" 
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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending 
            ? t('forms.saving') 
            : isEditMode ? t('common.save') : t('common.add')}
        </Button>
      </form>
    </Form>
  );
}
