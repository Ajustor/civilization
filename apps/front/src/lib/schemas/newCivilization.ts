
import { z } from 'zod'

export const newCivilizationSchema = z.object({
  name: z.string({
    required_error: 'Merci d\'entrer le nom de votre civilisation'
  }).min(5),

})

export type NewCivilizationSchema = typeof newCivilizationSchema
