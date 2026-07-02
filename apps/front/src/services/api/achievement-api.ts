import { client } from './client'

// Tableau des scores public : civilisations classées par points de succès.
export const getLeaderboard = async () => {
  const { data, error } = await client.civilizations.leaderboard.get()
  if (error) {
    console.error(error)
    throw error
  }
  return data
}

// Succès débloqués d'une civilisation du joueur (score + liste datée).
export const getCivilizationAchievements = async (
  authToken: string,
  civilizationId: string,
) => {
  const { data, error } = await client
    .civilizations({ civilizationId })
    .achievements.get({ headers: { authorization: `Bearer ${authToken}` } })
  if (error) {
    console.error(error)
    throw error
  }
  return data
}
