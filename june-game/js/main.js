import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createComposer, resizeComposer } from './postProcessing.js';
import { InputManager } from './inputManager.js';
import { JuneController } from './character/juneController.js';
import { NYCMap } from './world/nycMap.js';
import { DestinationMarker } from './world/destinationMarker.js';
import { ObstacleManager } from './obstacles/obstacleManager.js';
import { Meatball } from './collectibles/meatball.js';
import { ParticleSystem } from './vfx/particleSystem.js';
import { VomitEffect } from './vfx/vomitEffect.js';
import { BoostEffect } from './vfx/boostEffect.js';
import { VictoryEffect } from './vfx/victoryEffect.js';
import { SoundManager } from './audio/soundManager.js';
import { HUD } from './ui/hud.js';
import { MiniMap } from './ui/miniMap.js';
import { Screens } from './ui/screens.js';
import { gameState } from './gameState.js';
import { LEVELS, getLevel } from './world/levelData.js';
import { CAMERA } from './constants.js';

// ============================================================
// Core Three.js + Cannon-es setup
// ============================================================

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Attach canvas — fall back to document.body if no #game-canvas element
const canvasContainer = document.getElementById('game-canvas') || document.body;
canvasContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // sky blue

const camera = new THREE.PerspectiveCamera(CAMERA.FOV, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);

const clock = new THREE.Clock();

// Cannon-es physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);

// Post-processing composer (bloom + output)
const composer = createComposer(renderer, scene, camera);

// ============================================================
// Lighting
// ============================================================

function setupLighting() {
  // Hemisphere light (sky/ground ambient)
  const hemi = new THREE.HemisphereLight(0x87CEEB, 0x808060, 0.6);
  scene.add(hemi);

  // Sun directional light with shadows
  const sun = new THREE.DirectionalLight(0xFFF5E0, 1.8);
  sun.position.set(50, 80, 30);
  sun.castShadow = true;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.mapSize.setScalar(1024);
  sun.shadow.bias = -0.001;
  scene.add(sun);
}

setupLighting();

// ============================================================
// Game object references (populated per-level)
// ============================================================

/** @type {NYCMap|null} */
let map = null;
/** @type {JuneController|null} */
let juneController = null;
/** @type {DestinationMarker|null} */
let destMarker = null;
/** @type {ObstacleManager|null} */
let obstacleManager = null;
/** @type {Meatball[]} */
let meatballs = [];
/** @type {ParticleSystem|null} */
let particles = null;
/** @type {VomitEffect|null} */
let vomitEffect = null;
/** @type {BoostEffect|null} */
let boostEffect = null;
/** @type {VictoryEffect|null} */
let victoryEffect = null;

const input = new InputManager();
const sound = new SoundManager();
const hud = new HUD();

/** @type {MiniMap|null} */
let miniMap = null;

// ============================================================
// Camera follow
// ============================================================

const _camTargetVec = new THREE.Vector3();
const _camPosVec = new THREE.Vector3();

/**
 * Smooth third-person camera that orbits behind June.
 * @param {THREE.Group} juneGroup
 */
function updateCamera(juneGroup) {
  const facing = juneController ? juneController._facing : 0;

  // Desired camera position: behind and above June
  const ox = Math.sin(facing) * CAMERA.OFFSET_Z;
  const oz = Math.cos(facing) * CAMERA.OFFSET_Z;

  _camTargetVec.set(
    juneGroup.position.x,
    juneGroup.position.y + 1.0,
    juneGroup.position.z,
  );

  _camPosVec.set(
    juneGroup.position.x - ox,
    juneGroup.position.y + CAMERA.OFFSET_Y,
    juneGroup.position.z - oz,
  );

  camera.position.lerp(_camPosVec, CAMERA.LERP);
  camera.lookAt(_camTargetVec);
}

// ============================================================
// Level management
// ============================================================

function loadLevel(levelId) {
  cleanupLevel();

  const levelData = getLevel(levelId);
  gameState.reset();
  gameState.level = levelId;

  // Atmospheric fog
  scene.fog = new THREE.FogExp2(0xC8D8E8, levelData.fogDensity);

  // Build NYC map
  map = new NYCMap(scene, world, levelData.mapSeed);

  // Particle system (shared by all VFX)
  particles = new ParticleSystem(scene);
  vomitEffect = new VomitEffect(scene, particles);
  boostEffect = new BoostEffect(scene, particles);
  victoryEffect = new VictoryEffect(scene, particles);

  // June character controller
  juneController = new JuneController(scene, world, input);
  juneController.spawnAt(levelData.startPos.x, levelData.startPos.z);

  // Destination marker
  destMarker = new DestinationMarker(
    scene,
    levelData.destPos.x,
    levelData.destPos.z,
    levelData.destinationLabel,
  );

  // Obstacles — pass vomit/sound callbacks via onHit
  obstacleManager = new ObstacleManager(
    scene,
    world,
    levelData.obstacles,
    () => map.getRandomWalkablePosition(),
  );
  obstacleManager.onHit(() => {
    // juneController.onObstacleHit already called applySick via gameState
    // in obstacleManager.update — we just need the VFX + sound here
    vomitEffect.play(juneController.position, juneController._facing);
    sound.playVomit();
  });

  // Meatballs scattered around walkable zones
  for (let i = 0; i < levelData.meatballs; i++) {
    const pos = map.getRandomWalkablePosition();
    meatballs.push(new Meatball(scene, pos.x, pos.z));
  }

  // HUD destination label
  hud.setDestinationLabel(levelData.destinationLabel);
  hud.show();

  // Mini-map (map bounds: 5×5 grid at 40 units = 200 units, centred at 0)
  const bounds = { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
  if (miniMap) miniMap.dispose();
  miniMap = new MiniMap(map.walkableZones, bounds);

  // Reset footstep timer
  _footstepTimer = 0;
}

function cleanupLevel() {
  if (map) { map.dispose(); map = null; }
  if (juneController) { juneController.dispose(); juneController = null; }
  if (destMarker) { destMarker.dispose(); destMarker = null; }
  if (obstacleManager) { obstacleManager.dispose(); obstacleManager = null; }

  meatballs.forEach(m => m.dispose());
  meatballs = [];

  if (particles) { particles.dispose(); particles = null; }
  vomitEffect = null;
  boostEffect = null;
  victoryEffect = null;
}

// ============================================================
// Game loop
// ============================================================

let _gameRunning = false;
let _footstepTimer = 0;
const _FOOTSTEP_INTERVAL = 0.35; // seconds between footstep sounds at normal speed

function gameLoop() {
  requestAnimationFrame(gameLoop);

  // Cap dt to avoid spiral of death after tab switch / pause
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!_gameRunning || !juneController) {
    composer.render();
    return;
  }

  // --- Physics step ---
  world.fixedStep(1 / 60, dt);

  // --- Game state timers (boostTimer, sickTimer, collisionCooldown, elapsedTime) ---
  gameState.update(dt);

  // --- June controller ---
  juneController.update(dt);
  const junePos = juneController.position;
  const juneFacing = juneController._facing;

  // --- Footstep sound ---
  if (juneController._isMoving) {
    _footstepTimer -= dt;
    if (_footstepTimer <= 0) {
      sound.playFootstep();
      // Faster footstep rate when boosted
      const speedRatio = gameState.getSpeed() / 8;
      _footstepTimer = _FOOTSTEP_INTERVAL / Math.max(speedRatio, 0.5);
    }
  } else {
    _footstepTimer = 0;
  }

  // --- Obstacles ---
  if (obstacleManager) {
    obstacleManager.update(dt, junePos);
  }

  // --- Meatball collection ---
  for (const mb of meatballs) {
    mb.update(dt);
    if (mb.checkCollision(junePos)) {
      mb.collect();
      sound.playMeatballCollect();
      sound.playBoostActivate();
    }
  }

  // --- VFX ---
  if (particles) particles.update(dt);
  if (vomitEffect) vomitEffect.update(dt);
  if (boostEffect) boostEffect.update(dt, junePos, juneFacing);
  if (victoryEffect) victoryEffect.update(dt);

  // --- Destination marker + win condition ---
  if (destMarker) {
    destMarker.update(dt);

    if (!gameState.destinationReached && destMarker.isJuneNear(junePos, 4)) {
      gameState.destinationReached = true;
      _gameRunning = false;

      if (victoryEffect) victoryEffect.play(junePos);
      sound.playLevelComplete();

      const levelData = getLevel(gameState.level);
      setTimeout(() => {
        const hasNext = gameState.level < LEVELS.length;
        screens.showVictory(
          levelData,
          gameState.elapsedTime,
          gameState.meatballsCollected,
          hasNext,
        );
        hud.hide();
        if (miniMap) miniMap.hide();
      }, 2000);
    }
  }

  // --- Camera follow ---
  updateCamera(juneController.model.group);

  // --- HUD ---
  const destPos = destMarker ? destMarker.group.position : null;
  hud.update(junePos, destPos, gameState, camera);

  // --- Mini-map ---
  if (miniMap) miniMap.update(junePos, destPos);

  // --- Render ---
  composer.render();
}

// ============================================================
// Screen management
// ============================================================

const screens = new Screens(
  // onStart
  () => {
    sound.init();
    loadLevel(1);
    _gameRunning = true;
  },
  // onNextLevel
  () => {
    gameState.nextLevel();
    loadLevel(gameState.level);
    _gameRunning = true;
    hud.show();
    if (miniMap) miniMap.show();
  },
  // onRestart
  () => {
    loadLevel(gameState.level);
    _gameRunning = true;
    hud.show();
    if (miniMap) miniMap.show();
  },
);

// ============================================================
// Resize handler
// ============================================================

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  resizeComposer(composer, innerWidth, innerHeight);
});

// ============================================================
// Boot
// ============================================================

screens.showMenu();
gameLoop();
