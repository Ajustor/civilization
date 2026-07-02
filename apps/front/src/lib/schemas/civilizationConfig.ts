import { z } from 'zod'
import { DISTRIBUTABLE_OCCUPATIONS } from '@ajustor/simulation'

// One integer-percentage field per distributable occupation. Built from the
// simulation's list so the form stays in sync with the game's occupations.
const occupationDistributionShape = Object.fromEntries(
	DISTRIBUTABLE_OCCUPATIONS.map((occupation) => [
		occupation,
		z
			.number({ error: 'Merci d\'entrer un nombre' })
			.int('Le pourcentage doit être un entier')
			.min(0, 'Le pourcentage doit être positif')
			.max(100, 'Le pourcentage va de 0 à 100')
	])
) as Record<string, z.ZodNumber>

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
	nextBuildingToBuild: z.string().nullable().default(null),
	speedMode: z.boolean().default(true),
	// Répartition cible des métiers : un pourcentage entier par métier, somme = 100.
	occupationDistribution: z
		.object(occupationDistributionShape)
		.refine(
			(distribution) =>
				Object.values(distribution).reduce((sum, value) => sum + (value ?? 0), 0) === 100,
			{ message: 'La somme des pourcentages doit faire exactement 100' }
		)
})

export type CivilizationConfigSchema = typeof civilizationConfigSchema
