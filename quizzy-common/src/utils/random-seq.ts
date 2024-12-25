import { Random, MersenneTwister19937, createEntropy } from 'random-js';


export type RandomState = {
  available: string[];
  seed: readonly number[];
  useCount: number;
  weights: Readonly<Record<string, number>>;
  totalWeight: number;
};

export const initWeightedState = (
  weights: Readonly<Record<string, number>>,
  seed?: number
): RandomState => ({
  available: Object.keys(weights),
  seed: seed ? [seed] : createEntropy(),
  useCount: 0,
  weights,
  totalWeight: Object.values(weights).reduce((acc, weight) => acc + weight || 1, 0),
});

const epsilon1 = 1e-11;
const epsilon2 = 1e-14;

export const generateRandomObject = (
  { seed, useCount }: RandomState
) => new Random(
  MersenneTwister19937.seedWithArray(seed)
    .discard(useCount)
);

export const nextWeightedItem = (
  state: RandomState,
  random?: Random,
): [string | undefined, RandomState] => {
  const { available, seed, useCount, weights, totalWeight } = state;

  if (available.length === 0) {
    return [undefined, state];
  }

  random = random ?? generateRandomObject(state);
  let r = random.real(0, totalWeight);

  for (let i = 0; i < available.length; i++) {
    const item = available[i];
    const currentWeight = weights[item] || 1;
    r -= currentWeight;

    if (r < epsilon2) {
      const newAvailable = [...available];
      newAvailable.splice(i, 1);

      return [
        item,
        {
          seed,
          weights,
          available: newAvailable,
          totalWeight: totalWeight < epsilon1
            ? Object.values(weights).reduce((acc, weight) => acc + weight || 1, 0)
            : totalWeight - currentWeight,
          useCount: useCount + 1,
        }
      ];
    }
  }

  return [undefined, state];
};

export function* createWeightedGenerator(
  weights: Record<string, number>,
  seed?: number
): Generator<string, void, unknown> {
  let state = initWeightedState(weights, seed);

  const random = generateRandomObject(state);
  while (true) {
    const [item, newState] = nextWeightedItem(state, random);
    if (item == null) break;

    state = newState;
    yield item;
  }
}
