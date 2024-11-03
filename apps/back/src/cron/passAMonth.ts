import { Gender } from '@ajustor/simulation'
import '../libs/database/index'
import { CivilizationStatsModel } from '../libs/database/models'
import { CivilizationService } from '../modules/civilizations/service'
import { PeopleService } from '../modules/people/service'
import { WorldsTable } from '../modules/world/database'
import mongoose from 'mongoose'

const worldDbClientInstance = new WorldsTable()
const civilizationsDbClientInstance = new CivilizationService(
  new PeopleService(),
)

console.time('monthPass')
const worlds = await worldDbClientInstance.getAll()
console.timeLog('monthPass', 'Worlds retrieved')
for (const world of worlds) {
  console.timeLog('monthPass', 'Retrieve civilizations')
  const worldCivilizations =
    await civilizationsDbClientInstance.getAliveByWorldId(world.id, {
      people: true,
    })
  world.addCivilization(
    ...worldCivilizations.filter((civilization) => civilization.people.length),
  )
  console.timeLog('monthPass', 'Civilizations retrieved, pass a month')

  await world.passAMonth()
  for (const civilization of world.civilizations) {
    const { people, livedMonths, resources, id: civilizationId } = civilization

    const { men, women, pregnantWomen } = people.reduce(
      (acc, people) => {
        if (people.gender === Gender.MALE) {
          acc.men++
        }

        if (people.gender === Gender.FEMALE) {
          if (people.child) {
            acc.pregnantWomen++
          } else {
            acc.women++
          }
        }
        return acc
      },
      { men: 0, women: 0, pregnantWomen: 0 },
    )

    await CivilizationStatsModel.create({
      month: livedMonths,
      resources: resources.map((resource) => ({
        ...resource.formatToType(),
        resourceType: resource.type,
      })),
      civilizationId,
      people: { men, women, pregnantWomen },
    })
  }
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
