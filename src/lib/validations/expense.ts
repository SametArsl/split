// What? Zod schemas for validating expense inputs from the user.
// Why? To ensure data integrity, strictly type form inputs, and provide instant UI feedback before hitting the server.
import * as z from 'zod';

export const expenseSchema = z.object({
  description: z
    .string()
    .min(2, { message: "Açıklama en az 2 karakter olmalıdır." })
    .max(50, { message: "Açıklama çok uzun." }),
  
  // Note: App user inputs a decimal (e.g., 930.50). We will convert this to cents before saving to DB.
  amount: z
    .number({ message: "Geçerli bir tutar giriniz." })
    .positive({ message: "Tutar 0'dan büyük olmalıdır." }), 

  // Multi-Currency support
  currency: z.enum(['TRY', 'USD', 'EUR'], {
    message: "Lütfen geçerli bir para birimi seçin.",
  }),
  
  payerId: z.string().min(1, { message: "Lütfen bir ödeyen seçin." }),
  
  // What? Array of specific participants and how much they owe.
  // Why? To support custom scenarios where an expense is NOT split equally among everyone (e.g., "I ate the burger, you just had fries").
  splits: z.array(z.object({
    participantId: z.string().min(1),
    amountOwed: z.number().min(0), 
  })).optional(),
});

// Explicitly defining the type to prevent React Hook Form Resolver generic mismatched depth limits
export interface ExpenseFormValues {
  description: string;
  amount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  payerId: string;
  splits?: {
    participantId: string;
    amountOwed: number;
  }[];
}
