import mongoose from 'mongoose'
import { WorldModel } from './db/schema/worldModel'
import { ResourceTypes } from '@ajustor/simulation'

async function seed(): Promise<void> {
  await WorldModel.deleteMany()
  const newWorld = await WorldModel.create({
    name: 'The Holy kingdom',
    month: 0,
    resources: [
      {
        resourceType: ResourceTypes.FOOD,
        quantity: 10000
      },
      {
        resourceType: ResourceTypes.WOOD,
        quantity: 5000
      },
      {
        resourceType: ResourceTypes.STONE,
        quantity: 5000
      }
    ]
  })

  console.log('World inserted')

}

try {
  await mongoose.connect('mongodb://root:example@mongo:27017/')

  console.log('MongoDB Connected')

  await seed()

  process.exit(0)
} catch (e) {
  console.error(e.message)
}
