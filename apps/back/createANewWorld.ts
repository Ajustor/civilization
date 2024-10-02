import { EmailSender } from './src/libs/services/emailSender'
import { ResourceTypes } from '@ajustor/simulation'
import { WorldDestructionEmailTemplate } from './src/emailTemplates/worldDestruction'
import { CivilizationModel, PersonModel, UserModel, WorldModel } from './src/libs/database/models'

const topCivilizations = await CivilizationModel.find().sort({ livedMonths: 'desc' })

await PersonModel.deleteMany()
await CivilizationModel.deleteMany()

await WorldModel.deleteMany()
await WorldModel.create({
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

console.log(`Seeding complete.`)
console.log('Sending emails')
const emailService = new EmailSender()
const users = await UserModel.find()
const emails = users.map(({ email }) => email)

await emailService.sendBatch(emails, 'Oh non !', WorldDestructionEmailTemplate({ topCivilizationsNames: topCivilizations.map(({ name }) => name) }))