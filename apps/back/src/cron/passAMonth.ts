import '../libs/database/index'
import { CivilizationService } from '../modules/civilizations/service'
import { PeopleService } from '../modules/people/service'
import { WorldsTable } from '../modules/world/database'
import { runMonthForWorld } from '../modules/world/monthRunner'
import mongoose from 'mongoose'

const worldDbClientInstance = new WorldsTable()
const civilizationsDbClientInstance = new CivilizationService(
  new PeopleService(),
)

console.time('monthPass')
const worlds = await worldDbClientInstance.getAll()
console.timeLog('monthPass', 'Worlds retrieved')

for (const world of worlds) {
  console.timeLog('monthPass', 'Pass a month')
  await runMonthForWorld(world, civilizationsDbClientInstance)
  console.timeLog('monthPass', 'Month has passed, civilizations saved')
}
console.timeLog('monthPass', 'Civilizations saved, save the worlds')

try {
  await worldDbClientInstance.saveAll(worlds)
  console.timeEnd('monthPass')
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
