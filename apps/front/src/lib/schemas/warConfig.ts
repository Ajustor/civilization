import { z } from 'zod'

export const warConfigSchema = z.object({
	atWarWith: z.array(z.string()).default([])
})

export type WarConfigSchema = typeof warConfigSchema
