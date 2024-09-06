import { z } from 'zod'

export const passwordChangeSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(5, 'Le mot de passe doit faire au moins 5 caractères'),
  newPasswordVerif: z.string()
}).refine(({ newPassword, newPasswordVerif }) => newPassword === newPasswordVerif, {
  message: 'Les mot de passes ne correspondent pas',
  path: ['newPasswordVerif', 'newPassword'],
})

export type PasswordChangeSchema = typeof passwordChangeSchema