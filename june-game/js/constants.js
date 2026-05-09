// Colors (as hex numbers for Three.js)
export const COLORS = {
  JUNE_MAIN: 0xC8780A,      // warm orange-gold
  JUNE_DARK: 0x8B3E0A,      // reddish-brown ears/back
  JUNE_CREAM: 0xF5E2B8,     // cream chest/muzzle/paws
  JUNE_NOSE: 0xD4756B,      // pink nose
  JUNE_EYE_DARK: 0x1A0800,  // dark eye
  HARNESS: 0x1B8B6E,        // teal harness
  ROAD: 0x666666,
  SIDEWALK: 0xD4C5A9,
  BUILDING: 0x4A4A5A,
  BUILDING_LIGHT: 0x6A6A7A,
  MEATBALL: 0x8B4513,
  MEATBALL_GLOW: 0xFFAA44,
  DESTINATION: 0xFFD700,
  VOMIT: 0x5DBB63,
  BOOST_TRAIL: 0xFFD700,
  PIGEON: 0x888888,
  PUDDLE: 0x445566,
  TOURIST_SHIRT: [0xFF6B6B, 0x6B9DFF, 0xFFDB6B, 0x6BFFB8],
  CONSTRUCTION: 0xFF6B00,
  HYDRANT: 0xDD2222,
  CYCLIST: 0x2244AA,
};

// Speeds (units per second)
export const SPEEDS = {
  NORMAL: 8,
  BOOSTED: 18,
  SICK: 3,
  PIGEON: 3,
  TOURIST: 1.5,
  CYCLIST: 20,
};

// Timers (seconds)
export const TIMERS = {
  BOOST_DURATION: 5,
  SICK_DURATION: 3,
  MEATBALL_RESPAWN: 15,
  COLLISION_COOLDOWN: 0.5,
};

// Map config
export const MAP = {
  TILE_SIZE: 32,           // units per tile
  AVENUE_PITCH: 4,         // blocks between avenues
  STREET_PITCH: 3,         // blocks between streets
  ROAD_WIDTH: 8,           // units
  SIDEWALK_WIDTH: 2,       // units each side
  BUILDING_MIN_HEIGHT: 8,
  BUILDING_MAX_HEIGHT: 24,
};

// Physics
export const PHYSICS = {
  JUNE_RADIUS: 0.3,
  JUNE_HEIGHT: 0.4,
  OBSTACLE_RADIUS: 0.5,
  COLLISION_DISTANCE: 0.9,  // June radius + obstacle radius
};

// Camera
export const CAMERA = {
  OFFSET_X: 0,
  OFFSET_Y: 3.5,
  OFFSET_Z: 6,
  LERP: 0.08,
  FOV: 60,
};
