import { CivilizationService } from '../../civilizations/service'
import { PeopleService } from '../../people/service'
import { WorldsTable } from '../database'
import '../../../libs/database/index'

declare const self: Worker

const worldDbClientInstance = new WorldsTable()
const civilizationsDbClientInstance = new CivilizationService(new PeopleService())

self.addEventListener('message', async (event) => {
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
  } catch (error) {
    console.error(error)
  }
  process.exit()
})
