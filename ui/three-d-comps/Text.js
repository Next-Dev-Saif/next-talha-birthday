"use client";

import { Mesh, MeshPhongMaterial, CanvasTexture, Vector3 } from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

/**
 * create3DText
 * Creates a 3D gradient text mesh — safely compatible with Next.js SSR.
 *
 * @param {string} text - The text string to render.
 * @param {Object} options
 * @param {number} options.size - Font size (default: 0.3)
 * @param {number} options.height - Depth of extrusion (default: 0.03)
 * @param {Array} options.position - [x,y,z] position (default [0,0,0])
 * @param {Array} options.rotation - [x,y,z] rotation in radians (default [0,0,0])
 * @param {boolean} options.center - Whether to center the text geometry (default: true)
 * @returns {Promise<Mesh>} - Resolves with a THREE.Mesh containing the text
 */
export function create3DText(
  text,
  {
    size = 0.3,
    height = 0.03,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    center = true,
  } = {}
) {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();

    loader.load(
      "/default-font.json",
      (font) => {
        // ✅ SAFELY create gradient texture — only if in browser
        let gradientTexture;

        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const gradientCanvas = document.createElement("canvas");
          gradientCanvas.width = 256;
          gradientCanvas.height = 256;
          const ctx = gradientCanvas.getContext("2d");

          if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 256, 256);
            gradient.addColorStop(0, "crimson");
            gradient.addColorStop(1, "firebrick");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);

            gradientTexture = new CanvasTexture(gradientCanvas);
          }
        }

        // Fallback: if no canvas (e.g. SSR), use solid color material
        if (!gradientTexture) {
          console.warn("Canvas not available. Using fallback material.");
          gradientTexture = null;
        }

        // Create geometry
        const geometry = new TextGeometry(text, {
          font,
          size,
          height,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness: 0.005,
          bevelSize: 0.01,
          bevelSegments: 2,
        });

        // Center geometry
        if (center) {
          geometry.computeBoundingBox();
          const boundingBox = geometry.boundingBox;
          const centerOffset = boundingBox.getCenter(new Vector3()).negate();
          geometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
        }

        const material = new MeshPhongMaterial({
          map: gradientTexture || undefined, // fallback: no texture
          color: gradientTexture ? undefined : "crimson", // fallback color
          shininess: 180,
        });

        const mesh = new Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);

        resolve(mesh);
      },
      undefined,
      (err) => reject(err)
    );
  });
}