import { CivilizationModel, PersonModel, UserModel } from '../../libs/database/models'
import { Civilization } from '@ajustor/simulation'

export type GetOptions = {
  populate: {
    civilizations: boolean
  }
}

export type UserCreation = {
  username: string,
  password: string,
  email: string
}

export class UsersTable {
  constructor() {

  }

  async getAll(options?: GetOptions) {
    const users = await UserModel.find()

    return users
  }

  async create(user: UserCreation) {
    const createdUser = await UserModel.create(user)
    const authorizationKey = this.addAuthorizationKey(createdUser.id, user.password, user.email)
    createdUser.authorizationKey = authorizationKey
    await createdUser.save()
  }

  async getAuthUser({ username, password }: { username: string, password: string }) {

    const retrievedUser = await UserModel.findOne({
      $or: [
        { username },
        { email: username },
      ]
    })

    if (!retrievedUser || !retrievedUser.password) {
      return null
    }

    const isPasswordValid = await Bun.password.verify(password, retrievedUser.password)
    if (!isPasswordValid) {
      return null
    }

    const { password: _, username: retrievedUsername, id, email } = retrievedUser
    return { username: retrievedUsername, id, email }
  }

  async getById(id: string) {
    const userWithCivilizations = await UserModel.findOne({ _id: id }).select(['username', 'email', 'id']).populate<{ civilizations: Civilization[] }>({
      path: 'civilizations',
      model: CivilizationModel,
      populate: {
        path: 'people',
        model: PersonModel
      }
    }).exec()

    if (!userWithCivilizations) {
      return null
    }

    return userWithCivilizations
  }

  async getByEmail(email: string) {

    const user = await UserModel.findOne({ email }).select(['id', 'username', 'email', 'authorizationKey'])

    if (!user) {
      return null
    }

    return user
  }

  async resetPassword({ userId, password, authorizationKey }: { userId: string, password: string, authorizationKey: string }) {
    const newPassword = await Bun.password.hash(password)
    const foundUser = await UserModel.findOneAndUpdate({ _id: userId, authorizationKey }, {
      password: newPassword
    })

    if (!foundUser) {
      return
    }

    const newAuthorizationKey = this.addAuthorizationKey(userId, newPassword, foundUser?.email)
    foundUser.authorizationKey = newAuthorizationKey
    foundUser.save()
  }

  addAuthorizationKey(userId: string, userPassword: string, userEmail: string): string {
    const hasher = new Bun.CryptoHasher("blake2b256")

    const rawKey = `${userId}${userPassword}${userEmail}`
    const authorizationKey = hasher.update(rawKey, 'base64')

    return authorizationKey.digest('hex')
  }

  async exist(emailOrUsername: string): Promise<boolean> {
    const exists = await UserModel.exists({
      $or: [
        {
          username: emailOrUsername,
        },
        {
          email: emailOrUsername
        }
      ]
    })

    return !!exists?._id
  }

  async changePassword({ userId, oldPassword, newPassword }: { userId: string, oldPassword: string, newPassword: string }) {
    const retrievedUser = await UserModel.findOne({ _id: userId })

    if (!retrievedUser) {
      return null
    }

    const isPasswordValid = await Bun.password.verify(oldPassword, retrievedUser.password)
    if (!isPasswordValid) {
      throw new Error('Your password does not match')
    }

    const newHashedPassword = await Bun.password.hash(newPassword)

    const newAuthorizationKey = this.addAuthorizationKey(userId, newHashedPassword, retrievedUser?.email)
    retrievedUser.authorizationKey = newAuthorizationKey
    retrievedUser.password = newHashedPassword
    retrievedUser.save()
  }

}