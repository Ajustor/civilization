
export const callDeleteCivilization = async (civilizationId: string) => fetch('my-civilizations', {
  method: 'DELETE',
  body: JSON.stringify({ civilizationId })
})

export const callReclaimCivilizationResources = async (
  civilizationId: string,
  targetCivilizationId: string
) => {
  const response = await fetch('my-civilizations', {
    method: 'POST',
    body: JSON.stringify({ civilizationId, targetCivilizationId })
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body?.error ?? 'Erreur lors de la récupération des ressources')
  }

  return body
}

export const callGetCivilizations = async () => {
  const response = await fetch('my-civilizations', {
    method: 'GET'
  })

  return response.json()
}

// Fresh snapshot of the lazily-loaded stats (charts + combat logs), used by the
// live auto-refresh since the server-streamed promises don't update on their own.
export const callGetStats = async (civilizationId: string) => {
  const response = await fetch(`/my-civilizations/${civilizationId}/stats`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  return response.json()
}