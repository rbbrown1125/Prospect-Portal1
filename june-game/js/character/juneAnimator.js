import * as THREE from 'three';
import { gameState } from '../gameState.js';

export class JuneAnimator {
  constructor(juneModel) {
    this.model = juneModel;
    this._time = 0;
    this._vomitTimer = 0;
    this._baseBodyY = 0.35;
  }

  update(dt, isMoving, speed) {
    this._time += dt;

    // Tick vomit timer
    if (this._vomitTimer > 0) {
      this._vomitTimer -= dt;
      if (this._vomitTimer < 0) this._vomitTimer = 0;
    }

    const state = gameState.juneState;
    // Scale leg swing speed by movement speed, capped at 12 rad/s
    const legSpeed = isMoving ? Math.min(speed * 0.8, 12) : 0;

    if (isMoving) {
      this._animateWalk(legSpeed);
    } else {
      this._animateIdle();
    }

    this._animateEars(state, isMoving, speed);
    this._animateTail(state);
    this._animateBody(state);
  }

  _animateWalk(legSpeed) {
    if (this.model.legGroups.length < 4) return;

    const t = this._time * legSpeed;
    const swing = 0.45;

    // Diagonal pairs: FL+BR in phase, FR+BL opposite
    this.model.legGroups[0].rotation.x = Math.sin(t) * swing;               // FL
    this.model.legGroups[1].rotation.x = Math.sin(t + Math.PI) * swing;     // FR
    this.model.legGroups[2].rotation.x = Math.sin(t + Math.PI) * swing;     // BL
    this.model.legGroups[3].rotation.x = Math.sin(t) * swing;               // BR

    // Body bob — subtle vertical bounce
    this.model.bodyMesh.position.y = this._baseBodyY + Math.abs(Math.sin(t * 2)) * 0.025;
  }

  _animateIdle() {
    if (this.model.legGroups.length < 4) return;

    // Smooth legs back to neutral rotation
    for (const lg of this.model.legGroups) {
      lg.rotation.x *= 0.85;
    }

    // Smooth body back to rest height
    const diff = this._baseBodyY - this.model.bodyMesh.position.y;
    this.model.bodyMesh.position.y += diff * 0.1;

    // Gentle idle breathing — tiny body scale pulse
    const breathe = 1 + Math.sin(this._time * 1.5) * 0.008;
    this.model.bodyMesh.scale.set(breathe, breathe, breathe);
  }

  _animateEars(state, isMoving, speed) {
    const t = this._time;

    if (state === 'boosted') {
      // Ears swept back dramatically at speed
      this.model.leftEar.rotation.z = 0.6;
      this.model.rightEar.rotation.z = -0.6;
      this.model.leftEar.rotation.x = -0.3;
      this.model.rightEar.rotation.x = -0.3;
    } else if (state === 'sick') {
      // Ears droop forward/down during sick
      this.model.leftEar.rotation.z = -0.1;
      this.model.rightEar.rotation.z = 0.1;
      this.model.leftEar.rotation.x = 0.2;
      this.model.rightEar.rotation.x = 0.2;
    } else {
      // Normal: gentle sway based on movement speed
      const sway = isMoving ? 0.15 * (speed / 8) : 0.05;
      const earSwayL = Math.sin(t * 1.2 + 0.5) * sway;
      const earSwayR = Math.sin(t * 1.2) * sway;

      this.model.leftEar.rotation.z = 0.15 + earSwayL;
      this.model.rightEar.rotation.z = -(0.15 + earSwayR);
      this.model.leftEar.rotation.x = Math.sin(t * 0.7) * 0.05;
      this.model.rightEar.rotation.x = Math.sin(t * 0.7 + 0.3) * 0.05;
    }
  }

  _animateTail(state) {
    const t = this._time;

    if (state === 'boosted') {
      // Hyper excited fast wag
      this.model.tailMesh.rotation.z = Math.sin(t * 8) * 0.3;
    } else if (state === 'sick') {
      // Tail droops, barely moving
      const targetZ = -0.3;
      this.model.tailMesh.rotation.z += (targetZ - this.model.tailMesh.rotation.z) * 0.05;
    } else {
      // Happy normal wag
      this.model.tailMesh.rotation.z = Math.sin(t * 2) * 0.25;
    }
  }

  _animateBody(state) {
    if (state === 'sick') {
      // Head dips forward during sick (looking nauseous)
      const targetX = 0.35;
      this.model.headGroup.rotation.x = Math.min(
        this.model.headGroup.rotation.x + 0.05,
        targetX
      );
    } else {
      // Smoothly recover to upright
      this.model.headGroup.rotation.x *= 0.9;
    }

    // Boosted state: slight forward lean
    if (state === 'boosted') {
      this.model.headGroup.rotation.x += (-0.15 - this.model.headGroup.rotation.x) * 0.08;
    }
  }

  startVomit() {
    this._vomitTimer = 0.8;
  }
}
