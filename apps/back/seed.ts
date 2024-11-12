import mongoose from 'mongoose'
import { ResourceTypes } from '@ajustor/simulation'
import { WorldModel } from './src/libs/database/models'

async function seed(): Promise<void> {
  await WorldModel.deleteMany()
  const newWorld = await WorldModel.create({
    name: 'The Holy kingdom',
    month: 0,
    resources: [
      {
        resourceType: ResourceTypes.RAW_FOOD,
        quantity: 10000,
      },
      {
        resourceType: ResourceTypes.WOOD,
        quantity: 5000,
      },
      {
        resourceType: ResourceTypes.STONE,
        quantity: 5000,
      },
    ],
  })

  console.log('World inserted')
}

try {
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'MongoDB connection error:'),
  )
  await mongoose.connect(Bun.env.mongoConnectString ?? '')

  console.log('MongoDB Connected')

  await seed()

  process.exit(0)
} catch (e) {
  console.error(e.message)
}
