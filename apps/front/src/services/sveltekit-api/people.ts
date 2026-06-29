import type { PeopleType } from '@ajustor/simulation'


export const callGetPeople = async (civilizationId: string, pageIndex: number, pageSize: number, sort?: { field: string; order: 'asc' | 'desc' }): Promise<{ people: PeopleType[] }> => {
  const params = new URLSearchParams({ page: `${pageIndex}`, count: `${pageSize}` })
  if (sort) {
    params.set('sortField', sort.field)
    params.set('sortOrder', sort.order)
  }
  const response = await fetch(`/my-civilizations/${civilizationId}/people?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  return response.json()
}


export const callGetPeopleStream = async (civilizationId: string) => {
  const response = await fetch(`/my-civilizations/${civilizationId}/peoples?${new URLSearchParams({ civilizationId })}`, {
    method: 'GET',
  })

  return response.body?.getReader()
}