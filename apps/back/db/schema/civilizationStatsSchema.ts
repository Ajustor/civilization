import { Schema } from 'mongoose'
import { ResourceSchema } from './resourceSchema'

const statsPeopleSchema = new Schema({
  men: Number,
  women: Number,
  pregnantWomen: Number,
})

const civilizationStatsSchema = new Schema(
  {
    civilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
    },
    month: {
      type: Number,
      default: 0,
    },
    resources: {
      type: [ResourceSchema],
      required: true,
      default: [],
    },
    people: {
      type: statsPeopleSchema,
    },
  },
  {
    timestamps: true,
  },
)

export { civilizationStatsSchema }
