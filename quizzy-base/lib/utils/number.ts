export const randint = (min: number, max: number, count: number = 1) => {
  if (max - min + 1 < count) {
    throw new Error("Range is smaller than the requested count of unique numbers.");
  }

  const uniqueNumbers = new Set();
  
  while (uniqueNumbers.size < count) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    uniqueNumbers.add(randomNumber);
  }

  return Array.from(uniqueNumbers) as number[];
}