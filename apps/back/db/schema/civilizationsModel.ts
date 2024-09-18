import { BuildingType, BuildingTypes } from '@ajustor/simulation'
import mongoose from 'mongoose'

const { Schema } = mongoose

const BuildingSchema = new Schema<BuildingType>({
  capacity: Number,
  count: Number,
  id: mongoose.Schema.Types.ObjectId,
  type: BuildingTypes
})

// Schéma pour Civilization
const civilizationSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  livedMonths: {
    type: Number,
    required: true,
    default: 0
  },
  buildings: {
    type: [{ type: BuildingSchema }],
    required: true,
    default: []
  },
  people: {
    type: [{ type: Schema.Types.ObjectId }],
    ref: 'People',
    required: true,
    default: []
  },
  resources: {
    type: [{}]
  }
}, {
  timestamps: true
})

// Modèle Mongoose
export const Civilization = mongoose.model('Civilization', civilizationSchema)
