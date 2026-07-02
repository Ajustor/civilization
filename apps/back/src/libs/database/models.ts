import { model } from 'mongoose'
import { UserSchema } from '../../../db/schema/usersModel'
import { worldSchema } from '../../../db/schema/worldModel'
import { civilizationSchema } from '../../../db/schema/civilizationsModel'
import { PersonSchema } from '../../../db/schema/personModel'
import { civilizationStatsSchema } from '../../../db/schema/civilizationStatsSchema'
import { tradeOfferSchema } from '../../../db/schema/tradeOfferModel'
import { combatLogSchema } from '../../../db/schema/combatLogModel'
import { cemeteryStatsSchema, graveSchema } from '../../../db/schema/cemeteryModel'

export const UserModel = model('User', UserSchema)
export const WorldModel = model('World', worldSchema)
export const PersonModel = model('People', PersonSchema)
export const CivilizationModel = model('Civilization', civilizationSchema)
export const CivilizationStatsModel = model(
  'CivilizationStats',
  civilizationStatsSchema,
)
export const TradeOfferModel = model('TradeOffer', tradeOfferSchema)
export const CombatLogModel = model('CombatLog', combatLogSchema)
export const GraveModel = model('Grave', graveSchema)
export const CemeteryStatsModel = model('CemeteryStats', cemeteryStatsSchema)
