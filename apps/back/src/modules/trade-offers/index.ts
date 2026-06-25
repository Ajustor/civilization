import Elysia, { t } from 'elysia'
import { authorization } from '../../libs/handlers/authorization'
import { jwtMiddleware } from '../../libs/jwt'
import { logger } from '@bogeychan/elysia-logger'
import { TradeOfferService } from './service'

const tradeOfferService = new TradeOfferService()

const ResourceAmountDto = t.Object({
  resourceType: t.String(),
  quantity: t.Number({ minimum: 1 }),
})

export const tradeOffersModule = new Elysia()
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ tradeOfferService })
  .use(authorization('You must be connected to trade'))
  .get('/worlds/:worldId/trade-offers', ({ tradeOfferService, params: { worldId } }) =>
    tradeOfferService.listOpenByWorld(worldId),
  )
  .post(
    '/civilizations/:civilizationId/trade-offers',
    ({ tradeOfferService, params: { civilizationId }, body, user }) =>
      tradeOfferService.create(user.id as string, {
        worldId: body.worldId,
        fromCivilizationId: civilizationId,
        toCivilizationId: body.toCivilizationId ?? null,
        give: body.give,
        want: body.want,
      }),
    {
      body: t.Object({
        worldId: t.String(),
        toCivilizationId: t.Optional(t.Union([t.String(), t.Null()])),
        give: t.Array(ResourceAmountDto),
        want: t.Array(ResourceAmountDto),
      }),
    },
  )
  .post(
    '/trade-offers/:offerId/accept',
    ({ tradeOfferService, params: { offerId }, body, user }) =>
      tradeOfferService.accept(user.id as string, offerId, body.civilizationId),
    { body: t.Object({ civilizationId: t.String() }) },
  )
  .delete('/trade-offers/:offerId', ({ tradeOfferService, params: { offerId }, user }) =>
    tradeOfferService.cancel(user.id as string, offerId),
  )
