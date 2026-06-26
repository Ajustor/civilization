
export const callDeleteCivilization = async (civilizationId: string) => fetch('my-civilizations', {
  method: 'DELETE',
  body: JSON.stringify({ civilizationId })
})

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