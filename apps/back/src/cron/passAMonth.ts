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
  // Decide once per tick: all alive civilizations (at least one) in speed mode?
  const aliveCivs = await civilizationsDbClientInstance.getAliveByWorldId(world.id, { people: false })
  const speed = aliveCivs.length > 0 && aliveCivs.every((civ) => civ.config?.SPEED_MODE === true)
  // Nombre de mois par tick configurable PAR MONDE (défaut 12 = un an).
  const monthsToRun = speed ? (world.getConfig().SPEED_MODE_MONTHS ?? 12) : 1
  console.timeLog('monthPass', `Pass ${monthsToRun} month(s) (speed=${speed})`)
  for (let i = 0; i < monthsToRun; i++) {
    await runMonthForWorld(world, civilizationsDbClientInstance)
  }
  console.timeLog('monthPass', 'Month(s) have passed, civilizations saved')
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
