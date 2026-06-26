import webpush from 'web-push'
import { UserModel } from '../database/models'

export type PushPayload = {
  title: string
  body: string
  url?: string
}

const VAPID_SUBJECT = Bun.env.VAPID_SUBJECT ?? ''
const VAPID_PUBLIC_KEY = Bun.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = Bun.env.VAPID_PRIVATE_KEY ?? ''

/**
 * Sends Web Push (VAPID) notifications to users. Subscriptions are stored on the
 * user document (`pushSubscriptions`). When the VAPID keys are missing the
 * sender becomes a no-op so the app keeps working locally without push configured.
 */
export class PushSender {
  private readonly enabled: boolean

  constructor() {
    this.enabled = Boolean(
      VAPID_SUBJECT && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY,
    )

    if (this.enabled) {
      webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY,
      )
    } else {
      console.warn(
        '[PushSender] VAPID keys missing, push notifications are disabled.',
      )
    }
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  getPublicKey(): string {
    return VAPID_PUBLIC_KEY
  }

  /**
   * Sends a notification to every device a user registered. Dead subscriptions
   * (HTTP 404/410) are pruned from the user document. Errors are swallowed so a
   * failing push never breaks the calling flow.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) {
      return
    }

    const user = await UserModel.findById(userId, {
      pushSubscriptions: 1,
    }).lean()

    const subscriptions = user?.pushSubscriptions ?? []
    if (!subscriptions.length) {
      return
    }

    const serializedPayload = JSON.stringify(payload)
    const expiredEndpoints: string[] = []

    await Promise.all(
      subscriptions.map(async (subscription) => {
        if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
          return
        }
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            serializedPayload,
          )
        } catch (error) {
          const statusCode = (error as { statusCode?: number })?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            expiredEndpoints.push(subscription.endpoint)
          } else {
            console.error('[PushSender] Failed to send notification', error)
          }
        }
      }),
    )

    if (expiredEndpoints.length) {
      await UserModel.updateOne(
        { _id: userId },
        { $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } } },
      )
    }
  }
}

export const pushSender = new PushSender()
