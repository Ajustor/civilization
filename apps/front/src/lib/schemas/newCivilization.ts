
import { z } from 'zod'

export const newCivilizationSchema = z.object({
  name: z.string({
    error: 'Merci d\'entrer le nom de votre civilisation'
  }).min(5),
  worldId: z.string().optional(),
})

export type NewCivilizationSchema = typeof newCivilizationSchema
