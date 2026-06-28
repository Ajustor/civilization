import { t } from 'elysia'

export const ReclaimDto = t.Object({
  // Identifiant de la civilisation abandonnée (sans habitant) dont on récupère
  // les ressources. Elle doit, comme la civilisation réceptrice, appartenir au
  // joueur.
  targetCivilizationId: t.String(),
})

export type ReclaimDtoType = typeof ReclaimDto.static
