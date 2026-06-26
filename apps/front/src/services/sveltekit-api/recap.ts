import type { RecapData } from '@ajustor/civ-api'

export const callGetRecap = async (civilizationId: string): Promise<RecapData> => {
  const response = await fetch(`/my-civilizations/${civilizationId}/recap`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  return response.json()
}
