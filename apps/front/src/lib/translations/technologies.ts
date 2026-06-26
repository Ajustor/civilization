import { TechId } from '@ajustor/simulation'

export const techNames: Record<string, string> = {
  [TechId.CRAFTSMANSHIP]: 'Artisanat',
  [TechId.MASONRY]: 'Maçonnerie',
  [TechId.AGRONOMY]: 'Agronomie',
  [TechId.WAREHOUSING]: 'Entreposage',
  [TechId.MECHANIZATION]: 'Mécanisation',
  [TechId.MEDICINE]: 'Médecine',
  [TechId.METALLURGY]: 'Métallurgie',
}
