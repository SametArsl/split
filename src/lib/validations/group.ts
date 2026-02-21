// What? Zod schema for grouping/validating new group creation inputs.
// Why? Ensures group names are valid before we send the creation request to the Supabase database.
import * as z from 'zod';

export const groupSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Grup adı en az 3 karakter olmalıdır." })
    .max(30, { message: "Grup adı en fazla 30 karakter olabilir." }),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
