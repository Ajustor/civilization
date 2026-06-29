import { z } from 'zod'

export const civilizationConfigSchema = z.object({
	maximumChildrenPercentage: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le pourcentage doit être positif')
		.max(100, 'Le pourcentage va de 0 à 100'),
	maxActivePeopleByCivilization: z
		.number({ error: 'Merci d\'entrer un nombre' })
		.int()
		.min(0, 'Le nombre doit être positif')
		// Au-delà de l'entier sûr de JavaScript (2^53 - 1) les nombres perdent en
		// précision : on borne ici pour éviter toute valeur qui « casserait ».
		.max(Number.MAX_SAFE_INTEGER, 'Le nombre est trop grand'),
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
