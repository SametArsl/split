"use client"

// What? A specialized dialog component that encapsulates the CreateGroupForm.
// Why? To keep the group list page clean and handle modal open/close state locally.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateGroupForm } from '@/components/forms/CreateGroupForm';
import { useTranslation } from '@/context/language-context';

export function NewGroupDialog({ isGuest }: { isGuest: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // What? Callback function when a group is successfully created.
  // Why? Closes the modal and redirects the user immediately to the newly created group's page.
  const handleSuccess = (groupId: string) => {
    setOpen(false);
    router.push(`/groups/${groupId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl shadow-lg shadow-blue-500/10">
          <Plus className="h-4 w-4" />
          {t('groups.new_group')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800 rounded-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('groups.new_group')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('groups.description')}
          </DialogDescription>
        </DialogHeader>
        <CreateGroupForm onSuccess={handleSuccess} isGuest={isGuest} />
      </DialogContent>
    </Dialog>
  );
}
