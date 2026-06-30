export function isWithinChance(percentage: number): boolean {
  return (Math.random() * 100) <= percentage
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Mélange Fisher-Yates non biaisé (contrairement à un tri par `Math.random() - 0.5`
// qui produit une distribution biaisée). Renvoie une nouvelle liste, sans muter l'entrée.
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = result[i]
    result[i] = result[j]
    result[j] = swap
  }
  return result
}