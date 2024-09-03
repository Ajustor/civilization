import { z } from 'zod'

export const iForgotSchema = z.object({
  authorizationKey: z.string(),
  userId: z.string(),
  newPassword: z.string().min(5),
  newPasswordVerif: z.string()
}).refine(({ newPassword, newPasswordVerif }) => newPassword === newPasswordVerif, {
  message: "Les mot de passes ne correspondent pas",
  path: ["confirm"],
})

export type IForgotShema = typeof iForgotSchema