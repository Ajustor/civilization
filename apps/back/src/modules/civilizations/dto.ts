import { t } from 'elysia'

export const UpdateCivilizationDto = t.Object({
  openExchange: t.Optional(t.Array(t.String())),
  maximumChildrenPercentage: t.Optional(t.Number()),
  maxActivePeopleByCivilization: t.Optional(t.Number()),
  militaryRatio: t.Optional(t.Number()),
  atWarWith: t.Optional(t.Array(t.String())),
  nextBuildingToBuild: t.Optional(t.Union([t.String(), t.Null()])),
  speedMode: t.Optional(t.Boolean()),
  // Répartition cible des métiers : { [occupation]: pourcentage }, somme 100.
  occupationDistribution: t.Optional(t.Record(t.String(), t.Number())),
})

export type UpdateCivilizationDtoType = typeof UpdateCivilizationDto.static
