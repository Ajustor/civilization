import { Civilization, People, Resource, ResourceTypes, World } from '.'
import { input, select } from '@inquirer/prompts'

import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'

const world = new World()

world.addResource(
  new Resource(ResourceTypes.RAW_FOOD, 100),
  new Resource(ResourceTypes.WOOD, 10),
)
const myCivilization = new Civilization()

world.addCivilization(myCivilization)

const alice = new People({ month: 120, gender: Gender.FEMALE, lifeCounter: 3 })
const bob = new People({ month: 120, gender: Gender.MALE, lifeCounter: 3 })

alice.setOccupation(OccupationTypes.FARMER)
bob.setOccupation(OccupationTypes.CARPENTER)

// Adding some people
myCivilization.addPeople(alice)
myCivilization.addPeople(bob)

// Adding some resources
myCivilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 5))
myCivilization.addResource(new Resource(ResourceTypes.WOOD, 0)) // Start with no wood

function nextYear() {
  world.passAMonth()
  console.log(`---- Year: ${world.getYear()} ----`)
}

async function promptUser() {
  const command = await select({
    message: 'Enter command:',
    choices: [
      { name: 'Next Year', value: 'next' },
      { name: 'Display Status', value: 'year' },
      { name: 'Adapt people', value: 'adapt' },
      { name: 'Pass a few years', value: 'pass' },
      { name: 'Quit', value: 'quit' },
    ],
  })

  let numberOfYearsToPass: number = 1

  if (command === 'pass') {
    numberOfYearsToPass = +(await input({
      message: 'Select the number or years you want to pass',
      default: '0',
      validate(value) {
        if (Number.isNaN(value)) {
          return 'Please enter a number'
        }
        return true
      },
    }))
  }
  console.clear()

  switch (command.trim().toLowerCase()) {
    case 'year':
      break
    case 'quit':
      process.exit(0)
    case 'adapt':
      myCivilization.adaptPeopleJob()
      break
    case 'pass':
      if (Number.isNaN(numberOfYearsToPass)) {
        console.error('please use a number in pass command')
        break
      }
      for (let i = 0; i < numberOfYearsToPass; i++) {
        nextYear()
      }
      break
    case 'next':
    default:
      nextYear()
  }
  promptUser()
}

console.clear()

promptUser()
