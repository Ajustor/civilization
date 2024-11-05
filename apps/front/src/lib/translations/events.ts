import { Events } from '@ajustor/simulation'

export const eventsName = {
  [Events.EARTHQUAKE]: 'Tremblement de terre',
  [Events.STARVATION]: 'Famine',
  [Events.MIGRATION]: 'Vague de migration',
}

export const eventsDescription = {
  [Events.EARTHQUAKE]: 'Un tremblement de terre qui ravage les bâtiments.',
  [Events.STARVATION]: 'Les gens ont faim ! Ils vident les réserves du monde et de la civilisation !',
  [Events.MIGRATION]: "Les gens se déplacent beaucoup en ce moment. Les variations de population risquent d'être importantes"
}