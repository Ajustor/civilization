import { z } from 'zod'

export const warConfigSchema = z.object({
	atWarWith: z.array(z.string()).default([]),
	militaryRatio: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le ratio doit être positif')
		.max(100, 'Le ratio est un pourcentage (0–100)')
})

export type WarConfigSchema = typeof warConfigSchema
