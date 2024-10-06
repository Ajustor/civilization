import type { PeopleType } from '@ajustor/simulation'


export const callGetPeople = async (civilizationId: string): Promise<{ people: PeopleType[] }> => {
  const response = await fetch(`/my-civilizations/${civilizationId}?${new URLSearchParams({ civilizationId })}`, {
    method: 'GET',
  })

  return response.json()
}