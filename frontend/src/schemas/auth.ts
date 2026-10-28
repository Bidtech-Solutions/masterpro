import { z } from "zod";

/** Validasi form login (cermin LoginRequest API.md §8.1). Pesan berupa kunci messages dashboard.*. */
export const loginSchema = z.object({
  email: z.email({ error: "errorEmail" }).max(160),
  password: z.string().min(1, { error: "errorPasswordRequired" }).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
