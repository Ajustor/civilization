import { Gender, OccupationTypes, PeopleEntity } from '@ajustor/simulation'
import mongoose from 'mongoose'

const { Schema } = mongoose

const PeopleSchema = new Schema<PeopleEntity>({
  name: String,
  gender: Gender,
  buildingMonthsLeft: Number,
  id: String,
  isBuilding: Boolean,
  lifeCounter: Number,
  month: Number,
  occupation: OccupationTypes,
  pregnancyMonthsLeft: Number,
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
    type: [{ type: BuildingType }],
    required: true,
    default: []
  },
  people: {
    type: [{ type: PeopleSchema }],
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


const plop = await Civilization.find()

plop.at(0)?.people.at(0)?.