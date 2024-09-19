import mongoose from 'mongoose'
import { ResourceSchema } from './resourceSchema'

const { Schema } = mongoose

// Schéma pour World
const worldSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
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
  civilizations: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
    }],
    ref: 'Civilization'
  }
}, {
  timestamps: true
})

export const WorldModel = mongoose.model('World', worldSchema);

