import Elysia, { t } from 'elysia'
import { logger } from '@bogeychan/elysia-logger'

import { authorization } from '../../libs/handlers/authorization'
import { jwtMiddleware } from '../../libs/jwt'
import { pushSender } from '../../libs/services/pushSender'
import { UserModel } from '../../libs/database/models'

export const PushSubscriptionDto = t.Object({
  endpoint: t.String(),
  keys: t.Object({
    p256dh: t.String(),
    auth: t.String(),
  }),
})

export type PushSubscriptionDtoType = typeof PushSubscriptionDto.static

export const pushModule = new Elysia({ prefix: '/push' })
  .use(logger())
  .use(jwtMiddleware)
  // Public: the front needs the VAPID public key to create a subscription.
  .get('/public-key', () => ({ publicKey: pushSender.getPublicKey() }))
  .use(authorization('You need to login to manage push notifications'))
  // Named `register`/`unregister` rather than `subscribe` because the Eden
  // treaty client reserves `.subscribe` for opening WebSocket connections.
  .post(
    '/register',
    async ({ user, body }) => {
      // Upsert by endpoint so re-subscribing the same device does not create
      // duplicates.
      await UserModel.updateOne(
        { _id: user.id },
        { $pull: { pushSubscriptions: { endpoint: body.endpoint } } },
      )
      await UserModel.updateOne(
        { _id: user.id },
        { $push: { pushSubscriptions: body } },
      )
      return { subscribed: true }
    },
    { body: PushSubscriptionDto },
  )
  .post(
    '/unregister',
    async ({ user, body }) => {
      await UserModel.updateOne(
        { _id: user.id },
        { $pull: { pushSubscriptions: { endpoint: body.endpoint } } },
      )
      return { subscribed: false }
    },
    { body: t.Object({ endpoint: t.String() }) },
  )
