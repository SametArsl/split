"use client"

// What? A client-side form component for creating a new group.
// Why? We need interactive validation and submission state handling using React Hook Form, Zod, and Server Actions.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupSchema, GroupFormValues } from '@/lib/validations/group';
import { createGroup } from '@/app/actions/group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTranslation } from '@/context/language-context';

import { guestStorage } from '@/lib/guest-storage';

interface CreateGroupFormProps {
  onSuccess?: (groupId: string) => void;
  isGuest?: boolean;
}

export function CreateGroupForm({ onSuccess, isGuest }: CreateGroupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(data: GroupFormValues) {
    setIsSubmitting(true);
    setError(null);
    
    if (isGuest) {
      try {
        const newGroup = guestStorage.addGroup(data.name, 'TRY', t('common.me'));
        setIsSubmitting(false);
        form.reset();
        onSuccess?.(newGroup.id);
      } catch (e: any) {
        setError(e.message || 'common.error');
        setIsSubmitting(false);
      }
      return;
    }

    // What? Call the Next.js server action to interact with Supabase securely.
    const result = await createGroup(data);
    
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.groupId) {
      form.reset();
      onSuccess?.(result.groupId);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t('forms.group_name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('forms.group_placeholder')} {...field} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{t(error)}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('forms.saving') : t('groups.new_group')}
        </Button>
      </form>
    </Form>
  );
}
