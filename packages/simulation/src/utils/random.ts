export function isWithinChance(percentage: number): boolean {
  return (Math.random() * 100) <= percentage
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}