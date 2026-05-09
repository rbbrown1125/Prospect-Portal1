import { SPEEDS, TIMERS } from './constants.js';

export const gameState = {
  juneState: 'normal',  // 'normal' | 'boosted' | 'sick'
  boostTimer: 0,
  sickTimer: 0,
  collisionCooldown: 0,
  level: 1,
  meatballsCollected: 0,
  elapsedTime: 0,
  destinationReached: false,
  paused: false,

  getSpeed() {
    switch (this.juneState) {
      case 'boosted':
        return SPEEDS.NORMAL * 2.25;
      case 'sick':
        return SPEEDS.NORMAL * 0.375;
      default:
        return SPEEDS.NORMAL;
    }
  },

  applyBoost() {
    this.juneState = 'boosted';
    this.boostTimer = TIMERS.BOOST_DURATION;
    this.meatballsCollected += 1;
  },

  applySick() {
    if (this.collisionCooldown <= 0 && this.juneState !== 'boosted') {
      this.juneState = 'sick';
      this.sickTimer = TIMERS.SICK_DURATION;
      this.collisionCooldown = TIMERS.COLLISION_COOLDOWN;
      return true; // state changed — caller should trigger VFX
    }
    return false;
  },

  isInvincible() {
    return this.juneState === 'boosted';
  },

  update(dt) {
    if (this.paused) return;

    this.elapsedTime += dt;

    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= dt;
      if (this.collisionCooldown < 0) this.collisionCooldown = 0;
    }

    if (this.juneState === 'boosted') {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.boostTimer = 0;
        this.juneState = 'normal';
      }
    } else if (this.juneState === 'sick') {
      this.sickTimer -= dt;
      if (this.sickTimer <= 0) {
        this.sickTimer = 0;
        this.juneState = 'normal';
        // Reset collision cooldown on sick expiry so next hit is always valid
        this.collisionCooldown = TIMERS.COLLISION_COOLDOWN;
      }
    }
  },

  reset() {
    this.juneState = 'normal';
    this.boostTimer = 0;
    this.sickTimer = 0;
    this.collisionCooldown = 0;
    this.meatballsCollected = 0;
    this.elapsedTime = 0;
    this.destinationReached = false;
    this.paused = false;
  },

  nextLevel() {
    this.level += 1;
    this.reset();
  },
};
