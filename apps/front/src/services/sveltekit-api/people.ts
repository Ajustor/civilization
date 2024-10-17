import type { PeopleType } from '@ajustor/simulation'


export const callGetPeople = async (civilizationId: string, pageIndex: number, pageSize: number): Promise<{ people: PeopleType[] }> => {
  const response = await fetch(`/my-civilizations/${civilizationId}?${new URLSearchParams({ civilizationId, page: `${pageIndex}`, count: `${pageSize}` })}`, {
    method: 'GET',
  })

  return response.json()
}