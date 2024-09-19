import { Gender, OccupationTypes } from '@ajustor/simulation'
import { Schema, model } from 'mongoose'

const PeopleSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  name: String,
  gender: Gender,
  buildingMonthsLeft: Number,
  isBuilding: Boolean,
  lifeCounter: Number,
  month: Number,
  occupation: OccupationTypes,
  pregnancyMonthsLeft: Number,
  child: {
    type: Schema.Types.ObjectId,
    ref: 'People'
  }
})

export const PeopleModel = model('People', PeopleSchema)
