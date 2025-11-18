import { t } from 'elysia'

export const UpdateCivilizationDto = t.Object({
  openExchange: t.Optional(t.Array(t.String())),
  maximumChildren: t.Optional(t.Number()),
  maxActivePeopleByCivilization: t.Optional(t.Number()),
})

export type UpdateCivilizationDtoType = typeof UpdateCivilizationDto.static