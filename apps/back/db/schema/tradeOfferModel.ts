import { Schema } from 'mongoose'

const ResourceAmountSchema = new Schema(
  {
    resourceType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

export const tradeOfferSchema = new Schema(
  {
    worldId: { type: Schema.Types.ObjectId, ref: 'World', required: true },
    fromCivilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
      required: true,
    },
    toCivilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
      default: null,
    },
    give: { type: [ResourceAmountSchema], required: true },
    want: { type: [ResourceAmountSchema], required: true },
    status: {
      type: String,
      enum: ['open', 'accepted', 'cancelled'],
      required: true,
      default: 'open',
    },
    acceptedByCivilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
      default: null,
    },
  },
  { timestamps: true },
)
