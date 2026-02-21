"use server"

// What? Server actions for handling expenses within a specific group.
// Why? To keep database queries and data mutations secure on the server.
import { createServer } from '@/lib/supabase-server';
import { expenseSchema } from '@/lib/validations/expense';
import { revalidatePath } from 'next/cache';
import { toCents } from '@/utils/currency';

export async function getGroupDetails(groupId: string) {
  const supabase = await createServer();
  
  // What? Fetch the group info, participants, and expenses in parallel or sequential queries.
  // Note: RLS ensures users only get data if they are part of the group.
  const [groupRes, participantsRes, expensesRes] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('participants').select('*').eq('group_id', groupId),
    supabase.from('expenses').select(`
      *,
      payer:participants!payer_id(display_name),
      splits:expense_splits(*)
    `).eq('group_id', groupId).order('created_at', { ascending: false })
  ]);

  return {
    group: groupRes.data,
    participants: participantsRes.data || [],
    expenses: expensesRes.data || [],
    error: groupRes.error?.message || participantsRes.error?.message
  };
}

export async function addExpense(groupId: string, rawData: any) {
  const supabase = await createServer();
  
  // What? Validate form input from the client.
  const parsed = expenseSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'errors.invalid_expense' };
  }

  const { description, amount, payerId, splits, currency } = parsed.data;
  
  // What? Convert the float amount from the UI into integer Cents for DB storage.
  const amountInCents = toCents(amount);

  // 1. Insert the main expense record
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      description,
      amount: amountInCents,
      payer_id: payerId,
      currency
    })
    .select()
    .single();

  if (expError || !expense) {
    return { error: 'errors.expense_save_error' };
  }

  // 2. Handle splits
  // What? If an equal split was intended, we calculate it on the server. Otherwise, we use the provided split array.
  let splitsToInsert: any[] = [];
  
  if (splits && splits.length > 0) {
    // Custom split from UI
    splitsToInsert = splits.map(s => ({
      expense_id: expense.id,
      participant_id: s.participantId,
      amount_owed: toCents(s.amountOwed),
    }));
  } else {
    // Equal split among all participants in the group
    const { data: participants } = await supabase
      .from('participants')
      .select('id')
      .eq('group_id', groupId);
      
    if (participants && participants.length > 0) {
      const splitAmount = Math.round(amountInCents / participants.length);
      splitsToInsert = participants.map(p => ({
        expense_id: expense.id,
        participant_id: p.id,
        amount_owed: splitAmount
      }));
    }
  }

  if (splitsToInsert.length > 0) {
    await supabase.from('expense_splits').insert(splitsToInsert);
  }

  // What? Invalidate the cache for this specific group page.
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

// What? Server Action to add a "Ghost User" to a group.
export async function addGhostUser(groupId: string, name: string) {
  const supabase = await createServer();
  
  const { error } = await supabase
    .from('participants')
    .insert({
      group_id: groupId,
      display_name: name
      // user_id stays NULL because they are a ghost user
    });

  if (error) return { error: 'errors.add_member_error' };
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

// What? Server Action to remove a participant from a group.
// Why? Ensures users can correct mistakes when adding ghost users or removing inactive members.
export async function removeParticipant(groupId: string, participantId: string) {
  const supabase = await createServer();
  
  // What? Before deleting, check if this user is tied to any expenses
  // Why? If they paid for an expense or owe money in a split, deleting them will break financial records or trigger an ON DELETE constraint failure.
  const { data: expensesTied } = await supabase
    .from('expenses')
    .select('id')
    .eq('payer_id', participantId)
    .limit(1);
    
  if (expensesTied && expensesTied.length > 0) {
    return { error: 'errors.delete_participant_has_expenses' };
  }

  const { data: splitsTied } = await supabase
    .from('expense_splits')
    .select('id')
    .eq('participant_id', participantId)
    .limit(1);

  if (splitsTied && splitsTied.length > 0) {
    return { error: 'errors.delete_participant_has_splits' };
  }

  // Note: RLS ensures users can only delete participants if they have access to the group
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', participantId)
    .eq('group_id', groupId);

  if (error) {
    console.error('Participant Deletion Error:', error);
    return { error: 'errors.db_error_member_delete' };
  }
  
  // What? Invalidate the cache for this specific group page.
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

// What? Server Action to remove an expense from a group.
// Why? Ensures users can correct mistakes when adding expenses.
export async function removeExpense(groupId: string, expenseId: string) {
  const supabase = await createServer();
  
  // Note: RLS ensures users can only delete expenses if they have access to the group
  // and cascading deletes will automatically remove the associated expense_splits.
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('group_id', groupId);

  if (error) {
    console.error('Expense Deletion Error:', error);
    return { error: 'errors.db_error_expense_delete' };
  }
  
  // What? Invalidate the cache for this specific group page.
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

// What? Server Action to update an existing expense.
// Why? Modifying expenses allows users to fix mistakes without deleting and recreating.
export async function updateExpense(groupId: string, expenseId: string, rawData: any) {
  const supabase = await createServer();
  
  const parsed = expenseSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'errors.invalid_expense' };
  }

  const { description, amount, payerId, splits, currency } = parsed.data;
  const amountInCents = toCents(amount);

  // 1. Update the main expense record
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .update({
      description,
      amount: amountInCents,
      payer_id: payerId,
      currency
    })
    .eq('id', expenseId)
    .eq('group_id', groupId)
    .select()
    .single();

  if (expError || !expense) {
    console.error('Expense Update Error:', expError || 'No row updated');
    return { error: 'errors.expense_update_error' };
  }

  // 2. Clear old splits
  await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId);

  // 3. Insert new splits
  let splitsToInsert: any[] = [];
  
  if (splits && splits.length > 0) {
    splitsToInsert = splits.map(s => ({
      expense_id: expenseId,
      participant_id: s.participantId,
      amount_owed: toCents(s.amountOwed),
    }));
  } else {
    const { data: participants } = await supabase
      .from('participants')
      .select('id')
      .eq('group_id', groupId);
      
    if (participants && participants.length > 0) {
      const splitAmount = Math.round(amountInCents / participants.length);
      splitsToInsert = participants.map(p => ({
        expense_id: expenseId,
        participant_id: p.id,
        amount_owed: splitAmount
      }));
    }
  }

  if (splitsToInsert.length > 0) {
    const { error: splitError } = await supabase.from('expense_splits').insert(splitsToInsert);
    if (splitError) {
       console.error('Expense Split Update Error:', splitError);
       return { error: 'errors.split_update_error' };
    }
  }

  // What? Invalidate the cache for this specific group page.
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function updateExpenseSplits(groupId: string, expenseId: string, participantIds: string[]) {
  if (participantIds.length === 0) return { error: 'errors.at_least_one_participant' };

  const supabase = await createServer();

  // 1. Fetch current expense amount
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('id', expenseId)
    .single();

  if (fetchError || !expense) return { error: 'errors.db_error_expense_delete' };

  const amountInCents = expense.amount;
  const splitAmount = Math.round(amountInCents / participantIds.length);

  // 2. Delete old splits
  await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId);

  // 3. Insert new splits
  const splitsToInsert = participantIds.map(pid => ({
    expense_id: expenseId,
    participant_id: pid,
    amount_owed: splitAmount
  }));

  const { error: splitError } = await supabase.from('expense_splits').insert(splitsToInsert);
  
  if (splitError) return { error: 'errors.split_update_error' };

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
