import type { CivilizationType } from '@ajustor/simulation'
import { CivilizationModel, TradeOfferModel, UserModel } from '../../libs/database/models'
import { canFulfill, applyResourceChanges, type ResourceAmount } from './tradeLogic'

type StoredResource = { resourceType: string; quantity: number }

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
    return TradeOfferModel.create({
      worldId: input.worldId,
      fromCivilizationId: input.fromCivilizationId,
      toCivilizationId: input.toCivilizationId ?? null,
      give: input.give,
      want: input.want,
      status: 'open',
    })
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
