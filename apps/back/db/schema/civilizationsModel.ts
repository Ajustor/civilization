import { BuildingTypes, ResourceTypes } from '@ajustor/simulation'
import { Schema } from 'mongoose'
import { ResourceSchema } from './resourceSchema'
import {
  CivilizationModel, UserModel,
  WorldModel
} from '../../src/libs/database/models'

const BuildingSchema = new Schema({
  capacity: Number,
  count: Number,
  buildingType: {
    type: String,
    enum: BuildingTypes,
  },
  outputResources: {
    type: [
      {
        type: {
          probability: Number,
          resource: {
            type: String,
            enum: ResourceTypes,
          },
        },
      },
    ],
    required: false,
    default: [],
  },
})

const ConfigSchema = new Schema({
  PREGNANCY_PROBABILITY: Number,
  MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: Number,
  PEOPLE_CHARCOAL_CAN_HEAT: Number,
  CHANCE_TO_EVOLVE: Number,
  CHANCE_TO_BUILD_EVOLVED_BUILDING: Number,
  MAXIMUM_CHILDREN: Number,
  OPEN_EXCHANGE: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Civilization' }],
    required: true,
    default: [],
  },
  MILITARY_RATIO: { type: Number, default: 0 },
  NEXT_BUILDING_TO_BUILD: { type: String, default: null },
  AT_WAR_WITH: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Civilization' }],
    required: true,
    default: [],
  },
})

const civilizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    livedMonths: {
      type: Number,
      required: true,
      default: 0,
    },
    buildings: {
      type: [{ type: BuildingSchema }],
      required: true,
      default: [],
    },
    people: {
      type: [{ type: Schema.Types.ObjectId, ref: 'People' }],
      required: true,
      default: [],
    },
    resources: {
      type: [{ type: ResourceSchema }],
      required: true,
      default: [],
    },
    config: {
      type: ConfigSchema,
      required: true,
      default: {
        PREGNANCY_PROBABILITY: 60,
        MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: 100_000,
        PEOPLE_CHARCOAL_CAN_HEAT: 10,
        CHANCE_TO_EVOLVE: 20,
        CHANCE_TO_BUILD_EVOLVED_BUILDING: 25,
        MAXIMUM_CHILDREN: 10,
        OPEN_EXCHANGE: [],
        MILITARY_RATIO: 0,
        NEXT_BUILDING_TO_BUILD: null,
        AT_WAR_WITH: [],
      },
    },
    pendingConstructions: {
      type: [
        {
          buildingType: { type: String, required: true },
          monthsRemaining: { type: Number, required: true },
        },
      ],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

civilizationSchema.pre('deleteOne', async function () {
  const { _id: civilizationId } = this.getQuery()
  const civilization = await CivilizationModel.findById(civilizationId)

  if (!civilization) {
    throw new Error('It seams to have a big issue')
  }

  await WorldModel.updateMany({}, { $pull: { civilizations: civilizationId } })
  await UserModel.updateMany({}, { $pull: { civilizations: civilizationId } })
})

export { civilizationSchema }

