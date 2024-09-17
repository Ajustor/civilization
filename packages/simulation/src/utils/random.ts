export function isWithinChance(percentage: number): boolean {
  return (Math.random() * 100) <= percentage
}