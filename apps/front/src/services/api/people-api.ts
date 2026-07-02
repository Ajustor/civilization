import { client } from './client'

export const getPeopleFromCivilization = async (authToken: string, civilizationId: string) => {
  const { data: people, error } = await client.people({ civilizationId }).get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return people
}

export const getCivilizationPeopleStats = async (authToken: string, civilizationId: string) => {
  const { data: stats, error } = await client.people({ civilizationId }).stats.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return stats
}

export const getCivilizationPeopleJobsStats = async (authToken: string, civilizationId: string) => {
  const { data: stats, error } = await client.people({ civilizationId }).stats.jobs.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return stats
}

export const getCivilizationBuilders = async (authToken: string, civilizationId: string) => {
  const { data, error } = await client.people({ civilizationId }).builders.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return data.builders
}

export const getCivilizationPeopleRatioStats = async (authToken: string, civilizationId: string) => {
  const { data: stats, error } = await client.people({ civilizationId }).stats.peopleRatio.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return stats
}

export const getCivilizationPeopleAgePyramid = async (authToken: string, civilizationId: string) => {
  const { data: stats, error } = await client.people({ civilizationId }).stats.agePyramid.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return stats
}

export const getPeopleFromCivilizationPaginated = async (authToken: string, civilizationId: string, { page, count, sort }: { page: number; count: number; sort?: { field: string; order: 'asc' | 'desc' } }) => {
  const { data: people, error } = await client.people({ civilizationId }).paginated.get({
    query: {
      page,
      count,
      ...(sort ? { sortField: sort.field, sortOrder: sort.order } : {})
    },
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return people
}

export const getPeopleStreamFromCivilization = async (authToken: string, civilizationId: string) => {
  const { data: peopleStream, error } = await client.people({ civilizationId }).stream.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return peopleStream
}