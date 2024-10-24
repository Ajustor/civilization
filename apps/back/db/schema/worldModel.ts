import { Schema } from 'mongoose'
import { ResourceSchema } from './resourceSchema'
import { Events } from '@ajustor/simulation'

export const worldSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  nextEvent: {
    type: String,
    default: null,
    enum: Events
  },
  month: {
    type: Number,
    default: 0,
    required: true
  },
  resources: {
    type: [ResourceSchema],
    required: true,
    default: []
  },
  civilizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Civilization'
  }]
}, {
  timestamps: true
})


