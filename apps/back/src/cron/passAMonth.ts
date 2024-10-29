
import '../libs/database/index'
import { CivilizationService } from '../modules/civilizations/service'
import { PeopleService } from '../modules/people/service'
import { WorldsTable } from '../modules/world/database'
import mongoose from 'mongoose'

const worldDbClientInstance = new WorldsTable()
const civilizationsDbClientInstance = new CivilizationService(new PeopleService())

console.time('monthPass')
const worlds = await worldDbClientInstance.getAll()
console.timeLog('monthPass', 'Worlds retrieved')
for (const world of worlds) {
  console.timeLog('monthPass', 'Retrieve civilizations')
  const worldCivilizations = await civilizationsDbClientInstance.getAllByWorldId(world.id, { people: true })
  world.addCivilization(...worldCivilizations.filter((civilization) => civilization.people.length).sort(() => Math.random() - 0.5))
  console.timeLog('monthPass', 'Civilizations retrieved, pass a month')

  await world.passAMonth()
  console.timeLog('monthPass', 'Month has passed, save civilizations')
  await civilizationsDbClientInstance.saveAll(worldCivilizations)
  console.timeLog('monthPass', 'Civilizations saved')
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

