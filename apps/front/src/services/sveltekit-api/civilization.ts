
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