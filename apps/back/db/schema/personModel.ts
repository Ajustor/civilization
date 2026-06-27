import { Gender, OccupationTypes, type PeopleEntity } from '@ajustor/simulation'
import { Schema } from 'mongoose'

const PersonSchema = new Schema<PeopleEntity>({
  name: String,
  gender: {
    type: String,
    enum: Gender
  },
  buildingMonthsLeft: Number,
  isBuilding: Boolean,
  lifeCounter: Number,
  month: Number,
  numberOfChild: Number,
  lineage: {
    type: Schema.Types.Mixed,
    default: null
  },
  occupation: {
    type: String,
    enum: OccupationTypes,
    required: true
  },
  pregnancyMonthsLeft: Number,
  child: {
    type: Schema.Types.Mixed,
    default: null
  },
  originCivilizationId: {
    type: String,
    default: null
  }
})

PersonSchema.pre('save', async function (next) {
  if (this.lifeCounter === 0) {
    this.deleteOne()
  }
  next()
})

export { PersonSchema }