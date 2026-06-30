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
  // Anti-répétition des événements : dernier événement survenu + nb d'occurrences
  // consécutives. Persistés pour survivre à la reconstruction du monde à chaque tick.
  lastEvent: {
    type: String,
    default: null,
    enum: Events
  },
  eventStreak: {
    type: Number,
    default: 0
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
  // Per-world simulation config. Defaults mirror the simulation's defaultConfig so
  // existing worlds keep their behaviour; set custom values to tune a single world.
  config: {
    type: new Schema({
      BASE_FOOD_GENERATION: { type: Number, default: 30000 },
      BASE_WOOD_GENERATION: { type: Number, default: 15000 },
      EVENT_CHANCE: { type: Number, default: 30 },
      SPEED_MODE_MONTHS: { type: Number, default: 12 },
    }, { _id: false }),
    default: () => ({})
  },
  civilizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Civilization'
  }]
}, {
  timestamps: true
})


