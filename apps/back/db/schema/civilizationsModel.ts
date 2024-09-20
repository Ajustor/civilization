import { BuildingTypes } from '@ajustor/simulation'
import { Schema } from 'mongoose'
import { ResourceSchema } from './resourceSchema'
import { CivilizationModel, PersonModel, UserModel, WorldModel } from '../../src/libs/database/models'


const BuildingSchema = new Schema({
  capacity: Number,
  count: Number,
  buildingType: {
    type: String,
    enum: BuildingTypes
  }
})

const civilizationSchema = new Schema({
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
    type: [{ type: Schema.Types.ObjectId, ref: 'People', }],
    required: true,
    default: []
  },
  resources: {
    type: [{ type: ResourceSchema }],
    required: true,
    default: []
  }
}, {
  timestamps: true
})


civilizationSchema.pre('deleteOne', async function () {
  const { _id: id } = this.getQuery()
  const civilization = await CivilizationModel.findById(id).populate('people')

  if (!civilization) {
    throw new Error('It seams to have a big issue')
  }

  await PersonModel.deleteMany({ _id: { $in: civilization.people.map(({ id }) => id) } })
  await WorldModel.updateMany({}, { $pull: { civilizations: id } })
  await UserModel.updateMany({}, { $pull: { civilizations: id } })
})

export { civilizationSchema }