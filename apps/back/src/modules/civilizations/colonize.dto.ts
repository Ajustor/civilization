import { t } from 'elysia'

export const ColonizeDto = t.Object({
  colonyName: t.String({ minLength: 3 }),
  populationPercent: t.Number({ minimum: 5, maximum: 50 }),
  resources: t.Array(
    t.Object({
      type: t.String(),
      amount: t.Number({ minimum: 0 }),
    }),
  ),
  techs: t.Array(t.String()),
})

export type ColonizeDtoType = typeof ColonizeDto.static
