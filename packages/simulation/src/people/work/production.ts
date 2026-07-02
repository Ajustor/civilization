import { Campfire } from '../../buildings/campfire'
import { Farm } from '../../buildings/farm'
import { Kiln } from '../../buildings/kiln'
import { Library } from '../../buildings/library'
import { Sawmill } from '../../buildings/sawmill'
import { OccupationTypes } from './enum'
import { ResourceTypes } from '../../resource'

/**
 * Production par citoyen : le métier produit, le bâtiment booste.
 *
 * Les places offertes par les bâtiments debout (workerTypeRequired × count)
 * sont attribuées aux premiers travailleurs du métier, qui produisent la
 * version « boostée » ; les autres produisent la version « base ». Les taux
 * boostés sont dérivés des bâtiments (production du bâtiment ÷ places) pour
 * qu'un bâtiment plein produise exactement comme avant.
 *
 * Deux régimes :
 *  - le FERMIER (ici) et l'ÉRUDIT (recherche, plus bas) travaillent même sans
 *    bâtiment, à rendement dégradé — leur bâtiment n'est qu'un boost ;
 *  - les métiers de BUILDING_REQUIRED_OCCUPATIONS (mineur, commis de cuisine,
 *    charpentier, charbonnier) exigent leur bâtiment : leur conversion « base »
 *    est vide, un travailleur sans place ne produit rien (cas transitoire —
 *    la répartition plafonne leur effectif aux places bâties).
 */

export type WorkerConversion = {
  inputs: { resource: ResourceTypes; amount: number }[]
  outputs: { resource: ResourceTypes; amount: number }[]
}

export type OccupationProduction = {
  /** Par travailleur disposant d'une place dans le bâtiment. */
  boosted: WorkerConversion
  /** Par travailleur sans place (à la main, rendement dégradé). */
  base: WorkerConversion
}

// Taux par travailleur d'un bâtiment plein : production du bâtiment ÷ places.
const perSlot = (
  building: {
    inputResources: { resource: ResourceTypes; amount: number }[]
    outputResources: { resource: ResourceTypes; amount: number }[]
    workerTypeRequired: { occupation: OccupationTypes; count: number }[]
  },
  occupation: OccupationTypes,
): WorkerConversion => {
  const slots =
    building.workerTypeRequired.find(
      (worker) => worker.occupation === occupation,
    )?.count ?? 1
  return {
    inputs: building.inputResources.map(({ resource, amount }) => ({
      resource,
      amount: amount / slots,
    })),
    outputs: building.outputResources.map(({ resource, amount }) => ({
      resource,
      amount: amount / slots,
    })),
  }
}

export const OCCUPATION_PRODUCTION: Partial<
  Record<OccupationTypes, OccupationProduction>
> = {
  // Ferme pleine : 20 nourriture/fermier. À la main : 12 — à peine plus qu'un
  // récolteur, mais créée ex nihilo (non limitée par le stock du monde).
  [OccupationTypes.FARMER]: {
    boosted: perSlot(new Farm(1), OccupationTypes.FARMER),
    base: {
      inputs: [],
      outputs: [{ resource: ResourceTypes.RAW_FOOD, amount: 12 }],
    },
  },
  // Feu de camp requis : 10 brute → 7 préparée par commis en poste.
  [OccupationTypes.KITCHEN_ASSISTANT]: {
    boosted: perSlot(new Campfire(1), OccupationTypes.KITCHEN_ASSISTANT),
    base: { inputs: [], outputs: [] },
  },
  // Scierie requise : 5 planches par bois (2 charpentiers par scierie).
  [OccupationTypes.CARPENTER]: {
    boosted: perSlot(new Sawmill(1), OccupationTypes.CARPENTER),
    base: { inputs: [], outputs: [] },
  },
  // Four à chaux requis : 2 charbons par bois (2 charbonniers par four).
  [OccupationTypes.CHARCOAL_BURNER]: {
    boosted: perSlot(new Kiln(1), OccupationTypes.CHARCOAL_BURNER),
    base: { inputs: [], outputs: [] },
  },
}

// Recherche par érudit et par mois. En bibliothèque : la production du bâtiment
// ÷ ses places (2 pts / 2 érudits = 1). Sans bibliothèque : drastiquement
// réduit — il faut 5 érudits pour produire 1 point.
export const ERUDIT_BOOSTED_RESEARCH =
  Library.researchOutput /
  (new Library(1).workerTypeRequired.find(
    (worker) => worker.occupation === OccupationTypes.ERUDIT,
  )?.count ?? 1)

export const ERUDIT_BASE_RESEARCH = 0.2
