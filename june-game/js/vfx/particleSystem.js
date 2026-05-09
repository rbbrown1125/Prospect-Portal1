import * as THREE from 'three';

const POOL_SIZE = 300;

class Particle {
  constructor() {
    this.active = false;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.life = 0;
    this.maxLife = 1;
    this.size = 0.1;
    this.color = new THREE.Color(1, 1, 1);
    this.gravity = -3;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this._pool = Array.from({ length: POOL_SIZE }, () => new Particle());
    this._setupGeometry();
  }

  _setupGeometry() {
    // Use Points with BufferGeometry — single draw call for all particles
    this._posArr = new Float32Array(POOL_SIZE * 3);
    this._colArr = new Float32Array(POOL_SIZE * 3);
    this._sizeArr = new Float32Array(POOL_SIZE);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this._colArr, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this._sizeArr, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this._points = new THREE.Points(geo, mat);
    this.scene.add(this._points);
  }

  emit({ position, color, count = 20, spread = 1.5, speed = 4, lifetime = 0.8, size = 0.15, gravity = -5 }) {
    let emitted = 0;
    const c = new THREE.Color(color);

    for (let i = 0; i < POOL_SIZE && emitted < count; i++) {
      const p = this._pool[i];
      if (p.active) continue;

      p.active = true;
      p.position.copy(position);
      p.position.y += 0.3;

      // Random spherical direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * spread,
        Math.random() * speed,
        Math.sin(phi) * Math.sin(theta) * spread
      );

      p.life = lifetime * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.size = size * (0.5 + Math.random() * 1.0);
      p.color.copy(c);
      p.gravity = gravity;
      emitted++;
    }
  }

  update(dt) {
    let i3 = 0;
    for (let i = 0; i < POOL_SIZE; i++, i3 += 3) {
      const p = this._pool[i];

      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
        } else {
          p.velocity.y += p.gravity * dt;
          p.position.addScaledVector(p.velocity, dt);

          const alpha = p.life / p.maxLife;
          this._posArr[i3]     = p.position.x;
          this._posArr[i3 + 1] = p.position.y;
          this._posArr[i3 + 2] = p.position.z;
          this._colArr[i3]     = p.color.r * alpha;
          this._colArr[i3 + 1] = p.color.g * alpha;
          this._colArr[i3 + 2] = p.color.b * alpha;
          this._sizeArr[i]     = p.size * alpha;
          continue;
        }
      }

      // Inactive particle: park it far away so it's invisible
      this._posArr[i3]     = 1e6;
      this._posArr[i3 + 1] = 1e6;
      this._posArr[i3 + 2] = 1e6;
      this._colArr[i3]     = this._colArr[i3 + 1] = this._colArr[i3 + 2] = 0;
      this._sizeArr[i]     = 0;
    }

    this._points.geometry.attributes.position.needsUpdate = true;
    this._points.geometry.attributes.color.needsUpdate = true;
    this._points.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this._points);
    this._points.geometry.dispose();
    this._points.material.dispose();
  }
}
