"use client";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer, Clock } from "three";

/**
 * loadModel
 * Loads a GLTF/GLB model, applies transforms, and plays an animation if available.
 *
 * @param {string} src - Path/URL to the model file (e.g. "/model.glb")
 * @param {Object} options - Optional settings
 * @param {Array} options.position - [x, y, z] position (default [0,0,0])
 * @param {Array} options.rotation - [x, y, z] rotation in radians (default [0,0,0])
 * @param {Array} options.scale - [x, y, z] scale (default [1,1,1])
 * @param {number} options.animationIndex - Index of animation to play (default 0)
 * @returns {Promise<{ model: THREE.Group, mixer: THREE.AnimationMixer|null, clock: THREE.Clock|null }>}
 */
export function loadModel(
  src,
  {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    animationIndex = 0,
    name="default"
  } = {}
) {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      src,
      (gltf) => {
        const model = gltf.scene;
        model.userData.name=name;
        model.position.set(...position);
        model.rotation.set(...rotation);
        model.scale.set(...scale);

        let mixer = null;
        let clock = null;

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new AnimationMixer(model);
          const clip =
            gltf.animations[animationIndex] || gltf.animations[0];
          mixer.clipAction(clip).play();
          clock = new Clock();
        }

        resolve({ model, mixer, clock });
      },
      undefined,
      (error) => reject(error)
    );
  });
}
