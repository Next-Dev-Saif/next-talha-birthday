"use client";

import * as THREE from "three";
import { 
  Mesh, 
  BoxGeometry, 
  MeshBasicMaterial, 
  Color,
  Group
} from "three";

/**
 * createDiscoWave
 * Creates an animated disco beat visualization with rectangles arranged in a circle on the floor.
 * Mimics the Wave.jsx pattern but in a circular arrangement.
 * 
 * @param {Object} options
 * @param {Array} options.position - [x, y, z] position (default [0, 0, 0])
 * @param {Array} options.rotation - [x, y, z] rotation in radians (default [0, 0, 0])
 * @param {Array} options.scale - [x, y, z] scale (default [1, 1, 1])
 * @param {number} options.radius - Radius of the circle (default 6)
 * @param {number} options.barCount - Number of beat bars (default 24)
 * @param {number} options.barWidth - Width of each bar (default 0.15)
 * @param {number} options.barHeight - Base height of each bar (default 0.1)
 * @param {number} options.barDepth - Depth of each bar (default 0.3)
 * @param {number} options.speed - Animation speed multiplier (default 0.05)
 * @param {number} options.maxHeight - Maximum bar height multiplier (default 3.0)
 * @returns {Object} - Returns { mesh: THREE.Group, update: function }
 */
export function createDiscoWave({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 6,
  barCount = 24,
  barWidth = 0.15,
  barHeight = 0.1,
  barDepth = 0.3,
  speed = 0.05,
  maxHeight = 3.0
} = {}) {
  
  // Create a group to hold all beat bars
  const beatGroup = new Group();
  beatGroup.position.set(...position);
  beatGroup.rotation.set(...rotation);
  beatGroup.scale.set(...scale);
  
  // Create beat bars in a circle - mimicking Wave.jsx pattern
  const bars = [];
  const angleStep = (Math.PI * 2) / barCount;
  
  // Create random amplitudes for each bar (like Wave.jsx)
  const amplitudes = new Array(barCount).fill(0).map(() => Math.random());
  
  for (let i = 0; i < barCount; i++) {
    const angle = i * angleStep;
    
    // Calculate position on circle
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Create bar geometry
    const barGeometry = new BoxGeometry(barWidth, barHeight, barDepth);
    
    // Create material with disco color (using project's color scheme)
    const material = new MeshBasicMaterial({
      color: new Color("magenta"), // Using project's primary color
      transparent: true,
      opacity: 0.8
    });
    
    // Create bar mesh
    const bar = new Mesh(barGeometry, material);
    bar.position.set(x, barHeight / 2, z); // Position on floor
    bar.rotation.y = angle; // Face outward from center
    
    // Store properties for animation (like Wave.jsx)
    bar.userData = {
      index: i,
      amplitude: amplitudes[i],
      originalHeight: barHeight
    };
    
    beatGroup.add(bar);
    bars.push(bar);
  }
  
  // Animation variables (like Wave.jsx)
  let t = 0;
  
  // Update function for animation - mimicking Wave.jsx pattern
  const update = (deltaTime) => {
    t += speed;
    
    bars.forEach((bar) => {
      const userData = bar.userData;
      
      // Calculate bar height using sine wave (like Wave.jsx)
      const v = Math.abs(Math.sin(t + userData.index) * userData.amplitude);
      const currentHeight = v * maxHeight;
      
      // Scale the bar vertically
      bar.scale.y = currentHeight;
      
      // Adjust position to keep bottom of bar on floor
      const newHeight = userData.originalHeight * currentHeight;
      bar.position.y = newHeight / 2;
      
      // Update opacity based on height (like Wave.jsx gradient effect)
      bar.material.opacity = 0.3 + v * 0.7;
    });
  };
  
  return {
    mesh: beatGroup,
    update: update,
    bars: bars
  };
}
