import * as THREE from 'three';
import { COLORS } from '../constants.js';

export class VictoryEffect {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this._playing = false;
    this._timer = 0;
    this._position = new THREE.Vector3();
    this._burstTimer = 0;
  }

  play(position) {
    this._playing = true;
    this._timer = 3.0;
    this._position = position.clone();
    this._burstTimer = 0;
  }

  update(dt) {
    if (!this._playing) return;

    this._timer -= dt;
    this._burstTimer -= dt;

    if (this._burstTimer <= 0 && this._timer > 0) {
      this._burstTimer = 0.25; // burst every 250ms

      // Multiple color bursts
      const colors = [COLORS.DESTINATION, 0xFF6B6B, 0x6B9DFF, 0x6BFFB8, 0xFFFFFF];
      const c = colors[Math.floor(Math.random() * colors.length)];

      const burstPos = this._position.clone();
      burstPos.y += 1 + Math.random() * 2;
      burstPos.x += (Math.random() - 0.5) * 3;
      burstPos.z += (Math.random() - 0.5) * 3;

      this.particles.emit({
        position: burstPos,
        color: c,
        count: 30,
        spread: 3,
        speed: 5,
        lifetime: 1.2,
        size: 0.2,
        gravity: -4,
      });
    }

    if (this._timer <= 0) {
      this._playing = false;
    }
  }

  dispose() {
    // Nothing to dispose — particles managed by ParticleSystem
  }
}
