import * as THREE from 'three';
import { COLORS } from '../constants.js';

export class VomitEffect {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this._splats = [];
  }

  play(position, facing) {
    // Green particle burst from June's mouth direction
    const dir = new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing));
    const emitPos = position.clone().addScaledVector(dir, 0.5);
    emitPos.y += 0.5; // mouth height

    this.particles.emit({
      position: emitPos,
      color: COLORS.VOMIT,
      count: 35,
      spread: 1.2,
      speed: 3,
      lifetime: 0.9,
      size: 0.18,
      gravity: -6,
    });

    // Secondary small burst for drama
    this.particles.emit({
      position: emitPos.clone().addScaledVector(dir, 0.3),
      color: 0x8BC34A, // lighter green
      count: 15,
      spread: 0.6,
      speed: 2,
      lifetime: 0.6,
      size: 0.1,
      gravity: -4,
    });

    // Ground splat decal
    this._addSplat(position.clone().addScaledVector(dir, 1.0));
  }

  _addSplat(position) {
    // Irregular green splat on ground
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw irregular blob
    ctx.fillStyle = '#5DBB63';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 30 + Math.random() * 25;
      const x = 64 + Math.cos(angle) * r;
      const y = 64 + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 18 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3D9E42';
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(1.5, 1.5);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y = 0.03;
    this.scene.add(mesh);

    // Track splat + fade it after 6 seconds
    const splat = { mesh, timer: 6.0 };
    this._splats.push(splat);
  }

  update(dt) {
    for (let i = this._splats.length - 1; i >= 0; i--) {
      this._splats[i].timer -= dt;
      if (this._splats[i].timer <= 1.0) {
        this._splats[i].mesh.material.opacity = Math.max(0, this._splats[i].timer * 0.85);
      }
      if (this._splats[i].timer <= 0) {
        this.scene.remove(this._splats[i].mesh);
        this._splats[i].mesh.geometry.dispose();
        this._splats[i].mesh.material.dispose();
        this._splats.splice(i, 1);
      }
    }
  }

  dispose() {
    this._splats.forEach(s => {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
    });
    this._splats = [];
  }
}
