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
	openExchange: z.array(z.string()).default([]),
	militaryRatio: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le ratio doit être positif')
		.max(100, 'Le ratio est un pourcentage (0–100)'),
	atWarWith: z.array(z.string()).default([]),
	nextBuildingToBuild: z.string().nullable().default(null)
})

export type CivilizationConfigSchema = typeof civilizationConfigSchema
