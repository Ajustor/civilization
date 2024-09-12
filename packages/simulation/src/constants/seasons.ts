export const getSeason = (month: number) => {
  switch (month) {
    case 0:
    case 1:
    case 2:
      return 'spring'
    case 3:
    case 4:
    case 5:
      return 'summer'
    case 6:
    case 7:
    case 8:
      return 'autumn'
    case 9:
    case 10:
    case 11:
      return 'winter'
  }

  return 'nope'
} 