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

export const getPeopleFromCivilizationPaginated = async (authToken: string, civilizationId: string, { page, count }: { page: number, count: number }) => {
  const { data: people, error } = await client.people({ civilizationId }).paginated.get({
    query: {
      page,
      count
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