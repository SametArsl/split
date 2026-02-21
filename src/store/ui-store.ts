// What? A global Zustand store to manage purely UI-related states.
// Why? To share state across different React Client Components without prop drilling (e.g., controlling a modal from anywhere).
import { create } from "zustand";

interface UiState {
  isExpenseModalOpen: boolean;
  selectedExpenseId: string | null;
  editingExpense: any | null;
  setExpenseModalOpen: (isOpen: boolean) => void;
  setSelectedExpenseId: (id: string | null) => void;
  setEditingExpense: (expense: any | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isExpenseModalOpen: false,
  selectedExpenseId: null,
  editingExpense: null,

  // What? Action to toggle the add/edit expense modal.
  // Why? Allows any button in the app (like a FAB or header button) to open the modal easily.
  setExpenseModalOpen: (isOpen) => set({ isExpenseModalOpen: isOpen }),

  // What? Action to set the active expense ID.
  // Why? Useful when clicking "Edit" on a specific expense in the list to populate the edit form.
  setSelectedExpenseId: (id) => set({ selectedExpenseId: id}),

  // What? Action to set the full expense object being edited.
  // Why? Used to populate the ExpenseForm with initial data.
  setEditingExpense: (expense) => set({ editingExpense: expense }),
}));