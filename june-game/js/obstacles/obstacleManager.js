import { PigeonFlock }  from './pigeonFlock.js';
import { TouristGroup } from './tourist.js';
import { Cyclist }      from './cyclist.js';
import { Puddle }       from './puddle.js';
import { Construction } from './construction.js';
import { FireHydrant }  from './fireHydrant.js';
import { gameState }    from '../gameState.js';

export class ObstacleManager {
  /**
   * @param {THREE.Scene}  scene
   * @param {CANNON.World} world       (passed through but not used for static obstacles here)
   * @param {object}       levelConfig  obstacle count config from LEVELS[n].obstacles
   * @param {() => {x: number, z: number}} getRandomPos  function returning a random walkable point
   */
  constructor(scene, world, levelConfig, getRandomPos) {
    this.scene       = scene;
    this.world       = world;
    this._getRandPos = getRandomPos;

    this._pigeons      = null;
    this._tourists     = [];
    this._cyclists     = [];
    this._puddles      = [];
    this._constructions = [];
    this._hydrants     = [];

    /** Callback invoked when an obstacle hits June: (type: string) => void */
    this._onHit = null;

    this._spawn(levelConfig);
  }

  _applySickAndFire(type) {
    // Only fire VFX callback when sick state was actually newly applied
    if (gameState.applySick()) {
      this._fireHit(type);
    }
  }

  // ---------------------------------------------------------------------------
  // Callback registration
  // ---------------------------------------------------------------------------

  /**
   * Register a callback that fires every time June collides with an obstacle.
   * @param {(type: string) => void} callback
   */
  onHit(callback) {
    this._onHit = callback;
  }

  _fireHit(type) {
    if (this._onHit) this._onHit(type);
  }

  // ---------------------------------------------------------------------------
  // Spawning
  // ---------------------------------------------------------------------------

  _spawn(config) {
    // ---- Pigeons (all in one InstancedMesh draw call) ----
    const pigeonCount = config.pigeons ?? 15;
    this._pigeons = new PigeonFlock(this.scene, pigeonCount, this._getRandPos);
    // Wire pigeon hits through the manager's callback so VFX fires
    this._pigeons.onHit = () => this._fireHit('pigeon');

    // ---- Tourist groups ----
    const touristGroupCount = config.tourists ?? 5;
    for (let i = 0; i < touristGroupCount; i++) {
      const pos   = this._getRandPos();
      const count = 2 + Math.floor(Math.random() * 3); // 2–4 per group
      this._tourists.push(new TouristGroup(this.scene, pos.x, pos.z, count));
    }

    // ---- Cyclists (evenly spread across Z lanes) ----
    const cyclistCount = config.cyclists ?? 5;
    for (let i = 0; i < cyclistCount; i++) {
      // Spread cyclists across different Z lanes
      const laneSpacing = 40; // matches superBlockSize in nycMap
      const z = -((cyclistCount - 1) / 2) * laneSpacing + i * laneSpacing;
      const direction = i % 2 === 0 ? 1 : -1;
      const startX    = direction > 0 ? -110 : 110;
      this._cyclists.push(new Cyclist(this.scene, startX, z, direction));
    }

    // ---- Puddles ----
    const puddleCount = config.puddles ?? 12;
    for (let i = 0; i < puddleCount; i++) {
      const pos = this._getRandPos();
      this._puddles.push(new Puddle(this.scene, pos.x, pos.z));
    }

    // ---- Construction zones ----
    const constructionCount = config.construction ?? 2;
    for (let i = 0; i < constructionCount; i++) {
      const pos = this._getRandPos();
      this._constructions.push(new Construction(this.scene, this.world, pos.x, pos.z));
    }

    // ---- Fire hydrants ----
    const hydrantCount = config.hydrants ?? 8;
    for (let i = 0; i < hydrantCount; i++) {
      const pos = this._getRandPos();
      this._hydrants.push(new FireHydrant(this.scene, pos.x, pos.z));
    }
  }

  // ---------------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------------

  /**
   * @param {number} dt            seconds since last frame
   * @param {{ x: number, y: number, z: number }} junePos  June's world position
   */
  update(dt, junePos) {
    // ---- Moving obstacles ----
    this._pigeons.update(dt, junePos);
    this._tourists.forEach(t => t.update(dt));
    this._cyclists.forEach(c => c.update(dt));
    this._puddles.forEach(p => p.update(dt));

    // ---- Collision detection ----

    // Tourists
    this._tourists.forEach(t => {
      if (t.checkCollision(junePos)) this._applySickAndFire('tourist');
    });

    // Cyclists
    this._cyclists.forEach(c => {
      if (c.checkCollision(junePos)) this._applySickAndFire('cyclist');
    });

    // Construction zones
    this._constructions.forEach(c => {
      if (c.checkCollision(junePos)) this._applySickAndFire('construction');
    });

    // Fire hydrants
    this._hydrants.forEach(h => {
      if (h.checkCollision(junePos)) this._applySickAndFire('hydrant');
    });

    // Puddles — don't cause sick, just flag so juneController can apply slow
    let inPuddle = false;
    this._puddles.forEach(p => {
      if (p.isJuneInside(junePos)) inPuddle = true;
    });
    // Expose on gameState for juneController to read
    gameState._inPuddle = inPuddle;
  }

  // ---------------------------------------------------------------------------
  // Dispose
  // ---------------------------------------------------------------------------

  dispose() {
    this._pigeons?.dispose();

    this._tourists.forEach(t => t.dispose());
    this._tourists = [];

    this._cyclists.forEach(c => c.dispose());
    this._cyclists = [];

    this._puddles.forEach(p => p.dispose());
    this._puddles = [];

    this._constructions.forEach(c => c.dispose());
    this._constructions = [];

    this._hydrants.forEach(h => h.dispose());
    this._hydrants = [];
  }
}
