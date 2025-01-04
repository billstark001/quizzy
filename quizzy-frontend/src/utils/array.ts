
export const getChangedArray = <T,>(arr: readonly T[], index: number, value: T) => {
  return arr.map((x, i) => i == index ? value : x);
};