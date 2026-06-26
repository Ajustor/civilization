import type { PeopleType } from '@ajustor/simulation'


export const callGetPeople = async (civilizationId: string, pageIndex: number, pageSize: number): Promise<{ people: PeopleType[] }> => {
  const response = await fetch(`/my-civilizations/${civilizationId}?${new URLSearchParams({ civilizationId, page: `${pageIndex}`, count: `${pageSize}` })}`, {
    method: 'GET',
    // This route also has a +page.server.ts, so without an explicit Accept
    // SvelteKit serves the page HTML instead of the +server.ts JSON endpoint.
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