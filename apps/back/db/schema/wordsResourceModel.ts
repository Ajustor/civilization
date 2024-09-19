import mongoose from 'mongoose'
import { ResourceTypes } from '@ajustor/simulation'

const { Schema } = mongoose

// Schéma pour WorldsResources
const worldsResourcesSchema = new Schema({
  worldId: {
    type: Schema.Types.ObjectId,
    ref: 'World', // Référence au modèle World
    required: true
  },
  resourceType: {
    type: String,
    enum: [ResourceTypes.FOOD, ResourceTypes.WOOD, ResourceTypes.STONE],
    required: true
  },
  quantity: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
})

// Modèle Mongoose
export const WorldsResources = mongoose.model('WorldsResources', worldsResourcesSchema);

