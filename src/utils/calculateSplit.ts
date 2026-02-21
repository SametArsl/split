export interface Balance {
  participantId: string;
  netBalance: number; // Positive: They get money back (Alacaklı), Negative: They owe money (Borçlu)
}

export interface SplitResult {
  from: string;   // The one who pays
  to: string;     // The one who receives
  amount: number; // Amount to pay (in cents)
}

// What? A greedy algorithm to calculate the most efficient way to settle debts.
// Why? To simplify the debt network in a group so users make the minimum number of transactions possible.
export function calculateSplit(balances: Balance[]): SplitResult[] {
  // What? Separate array into debtors and creditors and sort them aggressively.
  // Why? Sorting by largest debt/credit first helps to eliminate the biggest balances in fewer moves (Greedy Approach).
  const debtors = balances.filter(b => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
  const creditors = balances.filter(b => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);

  let d = 0; // debtor index
  let c = 0; // creditor index
  const transactions: SplitResult[] = [];

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    // What? Determine the exact amount to transfer between this specific pair.
    // Why? It's the minimum of what the debtor owes and what the creditor is owed.
    const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);
    
    // What? Ensuring we only record valid transactions greater than 0.
    // Why? If there are floating point errors or zeroed amounts, we don't want empty transactions.
    if (amount > 0) {
      transactions.push({
        from: debtor.participantId,
        to: creditor.participantId,
        amount: Math.round(amount), // Ensuring it stays an integer (Cents)
      });
    }

    // What? Adjust the balances for both parties after the simulated transfer.
    // Why? To update their states so we know if we should move to the next debtor or creditor in the array.
    debtor.netBalance += amount;
    creditor.netBalance -= amount;

    // What? Advance the array pointers if the debt is settled or credit is fulfilled.
    // Why? Math.abs(< 1) is used instead of === 0 to handle absolute rounding precision effectively (within 1 cent).
    if (Math.abs(debtor.netBalance) < 1) {
      d++;
    }
    if (creditor.netBalance < 1) {
      c++;
    }
  }

  return transactions;
}
