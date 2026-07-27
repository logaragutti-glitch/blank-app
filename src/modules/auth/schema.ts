import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  organizationName: z.string().min(2).max(80),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
