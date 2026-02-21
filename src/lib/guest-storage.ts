"use client"

// What? Utilities for managing groups and expenses in localStorage for Guest Mode.
// Why? To allow users to use the app without signing up.

const STORAGE_KEY = 'split_guest_data';

export interface GuestGroup {
  id: string;
  name: string;
  currency: string;
  created_at: string;
  participants: GuestParticipant[];
  expenses: GuestExpense[];
}

export interface GuestParticipant {
  id: string;
  display_name: string;
}

export interface GuestExpense {
  id: string;
  description: string;
  amount: number; // in cents
  currency: string;
  payer_id: string;
  created_at: string;
  splits: GuestSplit[];
}

export interface GuestSplit {
  participant_id: string;
  amount_owed: number; // in cents
}

export const guestStorage = {
  getGroups: (): GuestGroup[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveGroups: (groups: GuestGroup[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  },

  addGroup: (name: string, currency: string = 'TRY', creatorName: string = 'Me'): GuestGroup => {
    const groups = guestStorage.getGroups();
    const newGroup: GuestGroup = {
      id: crypto.randomUUID(),
      name,
      currency,
      created_at: new Date().toISOString(),
      participants: [{ id: 'guest-me', display_name: creatorName }], // Localized default participant
      expenses: []
    };
    guestStorage.saveGroups([newGroup, ...groups]);
    return newGroup;
  },

  deleteGroup: (id: string) => {
    const groups = guestStorage.getGroups();
    const updatedGroups = groups.filter(g => g.id !== id);
    guestStorage.saveGroups(updatedGroups);
    return { success: true };
  },

  getGroup: (id: string): GuestGroup | undefined => {
    const group = guestStorage.getGroups().find(g => g.id === id);
    if (group && group.participants.length === 0) {
      group.participants = [{ id: 'guest-me', display_name: 'Me' }];
    }
    return group;
  },

  addParticipant: (groupId: string, name: string): GuestParticipant => {
    const groups = guestStorage.getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error('Group not found');

    const newParticipant: GuestParticipant = {
      id: crypto.randomUUID(),
      display_name: name
    };

    groups[groupIndex].participants.push(newParticipant);
    guestStorage.saveGroups(groups);
    return newParticipant;
  },

  removeParticipant: (groupId: string, participantId: string) => {
    const groups = guestStorage.getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const group = groups[groupIndex];
    // Check if participant has expenses or splits
    const hasExpenses = group.expenses.some(e => e.payer_id === participantId);
    const hasSplits = group.expenses.some(e => e.splits.some(s => s.participant_id === participantId));

    if (hasExpenses || hasSplits) {
      throw new Error('errors.delete_participant_has_expenses'); // Use same keys as server
    }

    group.participants = group.participants.filter(p => p.id !== participantId);
    guestStorage.saveGroups(groups);
  },

  addExpense: (groupId: string, expense: Omit<GuestExpense, 'id' | 'created_at'>): GuestExpense => {
    const groups = guestStorage.getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error('Group not found');

    const newExpense: GuestExpense = {
      ...expense,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    groups[groupIndex].expenses.unshift(newExpense);
    guestStorage.saveGroups(groups);
    return newExpense;
  },

  deleteExpense: (groupId: string, expenseId: string) => {
    const groups = guestStorage.getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    groups[groupIndex].expenses = groups[groupIndex].expenses.filter(e => e.id !== expenseId);
    guestStorage.saveGroups(groups);
  },

  updateExpense: (groupId: string, expenseId: string, updates: Partial<GuestExpense>) => {
    const groups = guestStorage.getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const group = groups[groupIndex];
    const expenseIndex = group.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) return;

    group.expenses[expenseIndex] = { ...group.expenses[expenseIndex], ...updates };
    guestStorage.saveGroups(groups);
  }
};
