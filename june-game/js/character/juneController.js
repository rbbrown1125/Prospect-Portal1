import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { JuneModel } from './juneModel.js';
import { JuneAnimator } from './juneAnimator.js';
import { gameState } from '../gameState.js';
import { SPEEDS, PHYSICS, CAMERA } from '../constants.js';

export class JuneController {
  constructor(scene, world, inputManager) {
    this.scene = scene;
    this.world = world;
    this.input = inputManager;

    this.model = new JuneModel();
    this.animator = new JuneAnimator(this.model);

    // Current facing angle (Y-axis rotation, radians)
    this._facing = 0;
    this._isMoving = false;

    this._setupPhysics();
    scene.add(this.model.group);
  }

  // ─── Physics setup ────────────────────────────────────────────────────────

  _setupPhysics() {
    const shape = new CANNON.Sphere(PHYSICS.JUNE_RADIUS);
    this.body = new CANNON.Body({
      mass: 1,
      shape,
      linearDamping: 0.99,
      angularDamping: 1.0, // prevent spinning
    });
    this.body.position.set(0, PHYSICS.JUNE_RADIUS, 0);
    // Freeze rotation axes so the body stays upright
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    this.world.addBody(this.body);
  }

  // ─── Accessors ────────────────────────────────────────────────────────────

  get position() {
    return this.model.group.position;
  }

  get group() {
    return this.model.group;
  }

  // ─── Spawn ────────────────────────────────────────────────────────────────

  spawnAt(x, z) {
    this.body.position.set(x, PHYSICS.JUNE_RADIUS, z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.model.group.position.set(x, 0, z);
    this._facing = 0;
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  update(dt) {
    if (gameState.paused) return;

    const move = this.input.getMovement();
    const speed = gameState.getSpeed();
    this._isMoving = (move.x !== 0 || move.z !== 0);

    if (this._isMoving) {
      // Determine target facing angle from world-relative input
      // Arrow Up (z=-1) → face toward negative Z (atan2(0,-1) = π but we want 0)
      // We want: facing=0 → moving toward -Z (into screen / "north")
      // atan2(move.x, -move.z) maps: up→0, right→π/2, down→π, left→-π/2
      const targetAngle = Math.atan2(move.x, -move.z);

      // Shortest-path angle interpolation
      let diff = targetAngle - this._facing;
      // Wrap to (-π, π)
      while (diff > Math.PI)  diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      this._facing += diff * 0.15;

      // Apply velocity through physics body
      const vx = Math.sin(this._facing) * speed;
      const vz = -Math.cos(this._facing) * speed; // negative Z is "forward"
      this.body.velocity.x = vx;
      this.body.velocity.z = vz;
    } else {
      // Dampen velocity when no input
      this.body.velocity.x *= 0.7;
      this.body.velocity.z *= 0.7;
    }

    // Keep June flat on the ground plane (no vertical physics)
    this.body.position.y = PHYSICS.JUNE_RADIUS;
    this.body.velocity.y = 0;

    // Sync Three.js mesh from physics body
    this.model.group.position.set(
      this.body.position.x,
      0,
      this.body.position.z
    );
    this.model.group.rotation.y = this._facing;

    // Tick the animator
    this.animator.update(dt, this._isMoving, speed);
  }

  // ─── Collision callbacks ──────────────────────────────────────────────────

  onObstacleHit(vfxManager) {
    gameState.applySick();
    this.animator.startVomit();
    if (vfxManager) {
      vfxManager.playVomit(this.model.group.position);
    }
  }

  onMeatballCollect(vfxManager) {
    gameState.applyBoost();
    if (vfxManager) {
      vfxManager.playBoost(this.model.group.position);
    }
  }

  // ─── Camera helper ────────────────────────────────────────────────────────

  /**
   * Returns the ideal camera target position behind June.
   * The caller lerps its camera toward this every frame.
   */
  getCameraTarget(camera) {
    const offsetLocal = new THREE.Vector3(CAMERA.OFFSET_X, CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);
    // Rotate offset by June's facing so camera stays behind her
    offsetLocal.applyEuler(new THREE.Euler(0, this._facing, 0));
    const target = this.model.group.position.clone().add(offsetLocal);
    return target;
  }

  /**
   * Returns the look-at point — slightly above June's head.
   */
  getCameraLookAt() {
    return this.model.group.position.clone().add(new THREE.Vector3(0, 0.5, 0));
  }

  // ─── Dispose ──────────────────────────────────────────────────────────────

  dispose() {
    this.world.removeBody(this.body);
    this.scene.remove(this.model.group);
    this.model.dispose();
  }
}
