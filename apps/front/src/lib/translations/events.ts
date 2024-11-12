import { Events } from '@ajustor/simulation'

type EventTranslations = { [key in Events]: string }

export const eventsName: EventTranslations = {
  [Events.EARTHQUAKE]: 'Tremblement de terre',
  [Events.STARVATION]: 'Famine',
  [Events.MIGRATION]: 'Vague de migration',
  [Events.FIRE]: 'Incendie',
  [Events.RAT_INVASION]: 'Invasion de rat',
}

export const eventsDescription: EventTranslations = {
  [Events.EARTHQUAKE]: 'Un tremblement de terre qui ravage les bâtiments.',
  [Events.STARVATION]: 'Les gens ont faim ! Ils vident les réserves du monde et de la civilisation !',
  [Events.MIGRATION]: "Les gens se déplacent beaucoup en ce moment. Les variations de population risquent d'être importantes",
  [Events.FIRE]: "D'immenses incendies se déclarent dans le royaume, les réserves de bois sont détruites",
  [Events.RAT_INVASION]: "Les rongeurs ont faim, ils pillent et détruisent les réserves de nourriture",
}
