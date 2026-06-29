import type { CivilizationType } from '@ajustor/simulation'
import {
  CivilizationModel,
  TradeOfferModel,
  UserModel,
  WorldModel,
} from '../../libs/database/models'
import { canFulfill, applyResourceChanges, type ResourceAmount } from './tradeLogic'
import { pushSender } from '../../libs/services/pushSender'

type StoredResource = { resourceType: string; quantity: number }

// French resource labels, mirrored from the front (`lib/translations/resources.ts`)
// so push notifications read naturally instead of exposing raw resource keys.
const RESOURCE_LABELS: Record<string, string> = {
  food: 'Nourriture',
  wood: 'Bois',
  stone: 'Pierre',
  plank: 'Planche',
  charcoal: 'Charbon',
  cookedFood: 'Nourriture préparée',
}

const formatResourceList = (items: ResourceAmount[]): string =>
  items
    .map((r) => `${r.quantity} ${RESOURCE_LABELS[r.resourceType] ?? r.resourceType}`)
    .join(', ')

export type CreateTradeOfferInput = {
  worldId: string
  fromCivilizationId: string
  toCivilizationId?: string | null
  give: ResourceAmount[]
  want: ResourceAmount[]
}

export class TradeOfferService {
  private async assertOwnership(userId: string, civilizationId: string) {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: CivilizationType[]
    }>({
      path: 'civilizations',
    })
    const owns = user?.civilizations?.some(({ id }) => id === civilizationId)
    if (!owns) {
      throw new Error('You do not own this civilization')
    }
  }

  async create(userId: string, input: CreateTradeOfferInput) {
    await this.assertOwnership(userId, input.fromCivilizationId)
    const offer = await TradeOfferModel.create({
      worldId: input.worldId,
      fromCivilizationId: input.fromCivilizationId,
      toCivilizationId: input.toCivilizationId ?? null,
      give: input.give,
      want: input.want,
      status: 'open',
    })

    // Notify the other players that a new offer is up for grabs. Never let a
    // push failure break offer creation.
    try {
      await this.notifyMarketSale(userId, input)
    } catch (error) {
      console.error('[TradeOfferService] Failed to send market notification', error)
    }

    return offer
  }

  /**
   * Sends a push notification when a player puts resources up for sale on the
   * market. An open offer notifies every other player who owns a civilization in
   * the world; a targeted offer notifies only the addressed civilization's owner.
   * The seller is always excluded from the recipients.
   */
  private async notifyMarketSale(
    sellerUserId: string,
    input: CreateTradeOfferInput,
  ): Promise<void> {
    const sellerCiv = await CivilizationModel.findById(input.fromCivilizationId, {
      name: 1,
    }).lean()
    const sellerName = sellerCiv?.name ?? 'Une civilisation'

    let recipientIds: string[]
    if (input.toCivilizationId) {
      const owner = await UserModel.findOne(
        { civilizations: input.toCivilizationId },
        { _id: 1 },
      ).lean()
      recipientIds = owner ? [String(owner._id)] : []
    } else {
      const world = await WorldModel.findById(input.worldId, {
        civilizations: 1,
      }).lean()
      const owners = await UserModel.find(
        { civilizations: { $in: world?.civilizations ?? [] } },
        { _id: 1 },
      ).lean()
      recipientIds = owners.map((owner) => String(owner._id))
    }

    // Deduplicate (a player may own several civilizations) and drop the seller.
    const recipients = [...new Set(recipientIds)].filter(
      (id) => id !== sellerUserId,
    )

    const giveLabel = formatResourceList(input.give)
    const wantLabel = formatResourceList(input.want)

    await Promise.all(
      recipients.map((userId) =>
        pushSender.sendToUser(userId, {
          title: '🏛️ Nouvelle offre au marché',
          body: `${sellerName} propose ${giveLabel} contre ${wantLabel}.`,
          url: `/worlds/${input.worldId}/market`,
        }),
      ),
    )
  }

  async listOpenByWorld(worldId: string) {
    return TradeOfferModel.find({ worldId, status: 'open' }).sort('-createdAt')
  }

  async cancel(userId: string, offerId: string) {
    const offer = await TradeOfferModel.findById(offerId)
    if (!offer || offer.status !== 'open') {
      throw new Error('Offer not found or not open')
    }
    await this.assertOwnership(userId, offer.fromCivilizationId.toString())
    offer.status = 'cancelled'
    await offer.save()
  }

  async accept(userId: string, offerId: string, acceptingCivilizationId: string) {
    await this.assertOwnership(userId, acceptingCivilizationId)

    const offer = await TradeOfferModel.findById(offerId)
    if (!offer || offer.status !== 'open') {
      throw new Error('Offer not found or not open')
    }
    if (
      offer.toCivilizationId &&
      offer.toCivilizationId.toString() !== acceptingCivilizationId
    ) {
      throw new Error('This offer is not addressed to your civilization')
    }
    if (offer.fromCivilizationId.toString() === acceptingCivilizationId) {
      throw new Error('You cannot accept your own offer')
    }

    const [seller, buyer] = await Promise.all([
      CivilizationModel.findById(offer.fromCivilizationId),
      CivilizationModel.findById(acceptingCivilizationId),
    ])
    if (!seller || !buyer) {
      throw new Error('A civilization in the trade no longer exists')
    }

    const give = offer.give.map((r) => ({ resourceType: r.resourceType, quantity: r.quantity }))
    const want = offer.want.map((r) => ({ resourceType: r.resourceType, quantity: r.quantity }))
    const sellerStock = seller.resources as unknown as StoredResource[]
    const buyerStock = buyer.resources as unknown as StoredResource[]

    if (!canFulfill(sellerStock, give)) {
      throw new Error('The offering civilization no longer has the resources')
    }
    if (!canFulfill(buyerStock, want)) {
      throw new Error('Your civilization does not have the requested resources')
    }

    // Seller loses `give`, gains `want`; buyer the opposite.
    seller.resources = applyResourceChanges(sellerStock, want, give) as never
    buyer.resources = applyResourceChanges(buyerStock, give, want) as never

    offer.status = 'accepted'
    offer.acceptedByCivilizationId = acceptingCivilizationId as never

    await Promise.all([seller.save(), buyer.save(), offer.save()])
  }
}
