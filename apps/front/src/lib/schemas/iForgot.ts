import { z } from 'zod'

export const iForgotSchema = z.object({
  authorizationKey: z.string(),
  userId: z.string(),
  newPassword: z.string().min(5, 'Le mot de passe doit faire au moins 5 caractères'),
  newPasswordVerif: z.string()
}).refine(({ newPassword, newPasswordVerif }) => newPassword === newPasswordVerif, {
  message: "Les mot de passes ne correspondent pas",
  path: ["newPasswordVerif"],
})

export type IForgotShema = typeof iForgotSchema