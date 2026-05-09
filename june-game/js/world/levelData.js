// Level definitions — no imports needed

export const LEVELS = [
  {
    id: 1,
    name: 'Empire State Building',
    destinationLabel: 'Empire State Building',
    destinationSubtitle: 'Midtown Manhattan',
    startPos: { x: -60, z: -80 },
    destPos: { x: 20, z: 30 },
    mapSeed: 42,
    obstacles: {
      pigeons: 20,
      tourists: 6,
      cyclists: 5,
      puddles: 12,
      hydrants: 8,
      construction: 2,
    },
    meatballs: 8,
    ambientColor: 0x404060,
    fogDensity: 0.008,
  },
  {
    id: 2,
    name: 'Washington Square Park',
    destinationLabel: 'Washington Square Park',
    destinationSubtitle: 'Greenwich Village',
    startPos: { x: 70, z: -60 },
    destPos: { x: -30, z: 50 },
    mapSeed: 137,
    obstacles: {
      pigeons: 30,
      tourists: 10,
      cyclists: 8,
      puddles: 18,
      hydrants: 12,
      construction: 3,
    },
    meatballs: 10,
    ambientColor: 0x304050,
    fogDensity: 0.006,
  },
  {
    id: 3,
    name: 'Brooklyn Bridge',
    destinationLabel: 'Brooklyn Bridge',
    destinationSubtitle: 'Lower Manhattan',
    startPos: { x: -80, z: 70 },
    destPos: { x: 60, z: -60 },
    mapSeed: 256,
    obstacles: {
      pigeons: 35,
      tourists: 14,
      cyclists: 12,
      puddles: 25,
      hydrants: 15,
      construction: 5,
    },
    meatballs: 12,
    ambientColor: 0x202535,
    fogDensity: 0.01,
  },
];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) || LEVELS[0];
}
