import { model } from 'mongoose'
import { UserSchema } from '../../../db/schema/usersModel'
import { worldSchema } from '../../../db/schema/worldModel'
import { civilizationSchema } from '../../../db/schema/civilizationsModel'
import { PersonSchema } from '../../../db/schema/personModel'

export const UserModel = model('User', UserSchema)
export const WorldModel = model('World', worldSchema)
export const PersonModel = model('People', PersonSchema)
export const CivilizationModel = model('Civilization', civilizationSchema)
