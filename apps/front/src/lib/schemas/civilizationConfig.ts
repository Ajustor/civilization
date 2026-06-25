import { z } from 'zod'

export const civilizationConfigSchema = z.object({
	maximumChildren: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le nombre doit être positif'),
	maxActivePeopleByCivilization: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le nombre doit être positif'),
	openExchange: z.array(z.string()).default([])
})

export type CivilizationConfigSchema = typeof civilizationConfigSchema
