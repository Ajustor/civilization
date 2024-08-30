import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string({
    required_error: 'Merci d\'entrer votre identifiant (email/nom d\'utilisateur)'
  }),
  password: z.string({
    required_error: "Merci d'entrer votre mot de passe"
  })
})

export type LoginSchema = typeof loginSchema
