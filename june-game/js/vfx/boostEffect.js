import * as THREE from 'three';
import { COLORS } from '../constants.js';
import { gameState } from '../gameState.js';

export class BoostEffect {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this._active = false;
    this._trailTimer = 0;
  }

  update(dt, junePosition, juneFacing) {
    const isBoosted = gameState.juneState === 'boosted';

    if (isBoosted) {
      this._active = true;
      this._trailTimer -= dt;

      if (this._trailTimer <= 0) {
        this._trailTimer = 0.05; // emit trail every 50ms

        // Gold particle trail behind June
        const behind = new THREE.Vector3(
          junePosition.x - Math.sin(juneFacing) * 0.8,
          junePosition.y + 0.3,
          junePosition.z - Math.cos(juneFacing) * 0.8
        );

        this.particles.emit({
          position: behind,
          color: COLORS.BOOST_TRAIL,
          count: 8,
          spread: 0.4,
          speed: 1.5,
          lifetime: 0.4,
          size: 0.12,
          gravity: -1,
        });

        // Occasional sparkle
        if (Math.random() < 0.3) {
          this.particles.emit({
            position: junePosition.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              0.4,
              (Math.random() - 0.5) * 0.5
            )),
            color: 0xFFFFFF,
            count: 3,
            spread: 0.2,
            speed: 2,
            lifetime: 0.3,
            size: 0.08,
            gravity: 0,
          });
        }
      }
    } else {
      this._active = false;
      this._trailTimer = 0;
    }
  }

  dispose() {
    // Nothing to dispose — particles managed by ParticleSystem
  }
}
