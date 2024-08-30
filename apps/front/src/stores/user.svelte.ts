function createUserStore() {
  let id = $state('')

  return {
    id,
    setUser(userId: string) {
      id = userId
    }
  }
}

export const user = createUserStore()