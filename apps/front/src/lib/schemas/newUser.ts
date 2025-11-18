import { z } from 'zod'

export const newUserSchema = z.object({
  username: z.string({
    error: 'Merci d\'entrer votre identifiant (nom d\'utilisateur)'
  }),
  email: z.email(),
  password: z.string({
    error: "Merci d'entrer votre mot de passe"
  }),
  passwordVerif: z.string()
}).refine(({ password, passwordVerif }) => password === passwordVerif, {
  message: "Les mot de passes ne correspondent pas",
  path: ["confirm"],
})

export type NewUserSchema = typeof newUserSchema
