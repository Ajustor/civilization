import { Schema } from 'mongoose'
import { ResourceSchema } from './resourceSchema'
import { Events } from '@ajustor/simulation'

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
    event: {
      type: String,
      default: null,
      enum: Events,
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
