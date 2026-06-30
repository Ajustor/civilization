import { Events } from '@ajustor/simulation'

type EventTranslations = { [key in Events]: string }

export const eventsName: EventTranslations = {
  [Events.EARTHQUAKE]: 'Tremblement de terre',
  [Events.STARVATION]: 'Famine',
  [Events.MIGRATION]: 'Vague de migration',
  [Events.FIRE]: 'Incendie',
  [Events.RAT_INVASION]: 'Invasion de rat',
  [Events.BOUNTIFUL_HARVEST]: 'Récolte abondante',
  [Events.TRADE_CARAVAN]: 'Caravane prospère',
  [Events.FORTUNATE_DISCOVERY]: 'Découverte fortuite',
  [Events.GOLDEN_AGE]: "Âge d'or",
}

export const eventsDescription: EventTranslations = {
  [Events.EARTHQUAKE]: 'Un tremblement de terre qui ravage les bâtiments.',
  [Events.STARVATION]: 'Les gens ont faim ! Ils vident les réserves du monde et de la civilisation !',
  [Events.MIGRATION]: "Les gens se déplacent beaucoup en ce moment. Les variations de population risquent d'être importantes",
  [Events.FIRE]: "D'immenses incendies se déclarent dans le royaume, les réserves de bois sont détruites",
  [Events.RAT_INVASION]: "Les rongeurs ont faim, ils pillent et détruisent les réserves de nourriture",
  [Events.BOUNTIFUL_HARVEST]: 'Les terres sont généreuses : les réserves de nourriture des civilisations gonflent.',
  [Events.TRADE_CARAVAN]: 'Une caravane de marchands traverse le monde et offre bois et pierre aux civilisations.',
  [Events.FORTUNATE_DISCOVERY]: 'Une avancée inattendue fait bondir les points de recherche des civilisations.',
  [Events.GOLDEN_AGE]: "Une période de prospérité attire une vague de colons prêts à travailler dans chaque civilisation.",
}
