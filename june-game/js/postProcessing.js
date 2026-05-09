import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createComposer(renderer, scene, camera) {
  const width = renderer.domElement.width;
  const height = renderer.domElement.height;

  const composer = new EffectComposer(renderer);

  // Base scene render
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom for glowing elements (meatballs, destination marker, boost trail)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.6,   // strength
    0.4,   // radius
    0.5    // threshold
  );
  composer.addPass(bloomPass);

  // Color space correction (replaces deprecated GammaCorrectionShader)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

export function resizeComposer(composer, width, height) {
  composer.setSize(width, height);
}
