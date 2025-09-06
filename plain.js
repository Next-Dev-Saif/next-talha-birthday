"use client";

import { useEffect, useRef, useState } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Mesh,
  Color,
  AmbientLight,
  SpotLight,
  CylinderGeometry,
  PointsMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  TextureLoader,
  PointLight,
  ConeGeometry,
  MeshLambertMaterial,
  Fog,
  SphereGeometry,
  AdditiveBlending,
  Clock as ThreeClock,
  DoubleSide,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadModel } from "./ui/three-d-comps/Model";
import { create3DText } from "./ui/three-d-comps/Text";
import { createDiscoWave } from "./ui/three-d-comps/DiscoWave";

export default function ThreeScene() {
  const mountRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ===== SETUP =====
    const totalAssets = 7; // 3 banners + 1 cake + 3 dancers
    let loadedAssets = 0;
    let fireworkIntervalId = null;
    let animationId = null;

    const updateProgress = () => {
      loadedAssets++;
      setLoadingProgress(loadedAssets / totalAssets);
    };

    // Scene
    const scene = new Scene();
    scene.background = new Color("#0a0a0a");

    // Camera
    const camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    if (window.innerHeight > 768) camera.position.set(0, 1, 6);
    else camera.position.set(0, 1, 10);

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for performance
    renderer.outputColorSpace = "srgb"; // Modern color space

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxZoom = 1;
    controls.maxDistance = 10;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    scene.add(new AmbientLight(0xffffff, 0.8));
    const point = new PointLight(0xffffff, 0.6, 50);
    point.position.set(0, 6, 0);
    scene.add(point);

    // Club room (optimized: use BufferGeometry)
    const room = new Mesh(
      new SphereGeometry(100, 32, 32), // reduced segments
      new MeshBasicMaterial({ color: 0x800080 }) // "purple" → hex
    );
    scene.add(room);

    // Table
    const table = new Mesh(
      new CylinderGeometry(100, 100, 0.7, 32),
      new MeshPhongMaterial({ color: 0x333333, shininess: 100 })
    );
    table.position.set(0, -0.35, 0);
    scene.add(table);

    // Disco Beat Bars on the floor (mimicking Wave.jsx pattern)
    const discoWave = createDiscoWave({
      position: [0, 0, 0], // Position on the floor
      rotation: [0, 0, 0], // No rotation needed for floor placement
      scale: [1, 1, 1],
      radius: 6, // Circle radius
      barCount: 40, // Number of beat bars
      barWidth: 0.15, // Width of each bar
      barHeight: 0.1, // Base height of each bar
      barDepth: 0.3, // Depth of each bar
      speed: 0.05, // Animation speed (same as Wave.jsx)
      maxHeight: 3 // Maximum bar height multiplier
    });
    scene.add(discoWave.mesh);

    // Fog
    const fog = new Fog(0xff00ff, 3, 100); // "magenta" → hex
    scene.fog = fog;

    // Banner loader function
    const loader = new TextureLoader();
    const loadBanner = (position,src) => {
      loader.load(
        src,
        (texture) => {
          const bannerGeo = new PlaneGeometry(3, 5);
          const bannerMat = new MeshBasicMaterial({ map: texture, toneMapped: false });
          const banner = new Mesh(bannerGeo, bannerMat);
          banner.position.set(...position);
          if (position[0] !== 0) banner.lookAt(camera.position);
          scene.add(banner);

          let startTime = null;
          banner.userData.update = (currentTimeMs) => {
            if (startTime === null) startTime = currentTimeMs;
            const t = (currentTimeMs - startTime) * 0.001; // seconds
            banner.position.y = 2 + Math.sin(t * 0.5) * 0.5; // slower float
          };

          updateProgress();
        },
        undefined,
        () => updateProgress()
      );
    };

    loadBanner([0, 2, -2],"/Banner.png");
    loadBanner([5, 2, -2],"/talha-photos/photo-1.jpg");
    loadBanner([-5, 2, -2],"/talha-photos/photo-2.jpg");

    // Club lights
    const createClubLight = (color, x, z) => {
      const spot = new SpotLight(color, 8, 40, Math.PI / 6, 0.4); // reduced intensity
      spot.position.set(x, 3, z);
      scene.add(spot);

      const cone = new Mesh(
        new ConeGeometry(3, 10, 16, 1, true), // reduced segments
        new MeshLambertMaterial({
          color,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        })
      );
      cone.position.copy(spot.position);
      cone.rotation.x = -Math.PI / 2.5;
      scene.add(cone);

      return { spot, cone };
    };

    const clubLights = [
      createClubLight(0xff00ff, 5, 0),
      createClubLight(0x00ffff, -5, 0),
      createClubLight(0xffff00, 0, 5),
    ];

    // Particles (optimized)
    const particles = new BufferGeometry();
    const particleCount = 400; // reduced from 800 for performance
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    particles.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const particleMaterial = new PointsMaterial({
      color: 0xffffff,
      size: 0.04, // smaller
      transparent: true,
      opacity: 0.5,
      depthWrite: false, // improves performance
    });
    const stars = new Points(particles, particleMaterial);
    scene.add(stars);

    // Mixers
    const mixers = [];

    // Load models
    loadModel("/cake.glb", {
      position: [0, 0, 5],
      scale: [0.005, 0.005, 0.005],
    }).then(({ model }) => {
      scene.add(model);
      updateProgress();
    }).catch(() => updateProgress());

    const dancerConfigs = [
      { position: [3, 0, 0], animationIndex: 1 },
      { position: [-3, 0, 0], animationIndex: 0 },
      { position: [0, 0, 1], animationIndex: 3 },
    ];

    dancerConfigs.forEach((config) => {
      loadModel("/Dancer.glb", {
        ...config,
        scale: [1.1, 1.1, 1.1],
      }).then(({ model, mixer, clock }) => {
        scene.add(model);
        if (mixer && clock) mixers.push({ mixer, clock });
        updateProgress();
      }).catch(() => updateProgress());
    });

    // Fireworks system
    const fireworks = [];
    let mainClock = null;

    const createFirework = (x, y, z) => {
      const particleCount = 150; // reduced for performance
      const particles = new BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const hue = Math.random();
      const color = new Color().setHSL(hue, 1, 0.5);

      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = Math.random() * 2.5; // reduced

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const colorOffset = new Color()
          .copy(color)
          .offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
        colors[i * 3] = colorOffset.r;
        colors[i * 3 + 1] = colorOffset.g;
        colors[i * 3 + 2] = colorOffset.b;
      }

      particles.setAttribute("position", new Float32BufferAttribute(positions, 3));
      particles.setAttribute("color", new Float32BufferAttribute(colors, 3));

      const material = new PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      const firework = new Points(particles, material);
      firework.position.set(x, y, z);

      let life = 1.0;
      const decay = 0.02;

      fireworks.push({
        mesh: firework,
        update: () => {
          life -= decay;
          firework.material.opacity = life;
          firework.scale.setScalar(1 + (1 - life) * 2);
          if (life <= 0) {
            scene.remove(firework);
            particles.dispose();
            material.dispose();
          }
          return life <= 0;
        },
      });

      scene.add(firework); // add immediately
    };

    const launchRandomFirework = () => {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      const y = 4 + Math.random() * 8;
      createFirework(x, y, z);
    };

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!mainClock) return; // wait until clock is ready

      controls.update();
      const t = mainClock.getElapsedTime();

      // Update lights
      clubLights.forEach(({ spot, cone }, i) => {
        const angle = t * 0.5 + i * 2; // slower rotation
        spot.position.x = Math.sin(angle) * 6;
        spot.position.z = Math.cos(angle) * 6;
        cone.position.copy(spot.position);
        cone.lookAt(0, 0, 0);
      });

      // Update banners
      scene.traverse((obj) => {
        if (obj.userData.update) obj.userData.update(t * 1000);
      });

      // Rotate particles
      stars.rotation.y += 0.0005; // slower

      // Update animations
      mixers.forEach(({ mixer, clock }) => {
        mixer.update(clock.getDelta());
      });

      // Update disco wave
      if (discoWave && discoWave.update) {
        discoWave.update(0.016); // ~60fps delta time
      }

      // Update fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        if (fireworks[i].update()) {
          fireworks.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Start everything when loaded
    const checkIfReady = () => {
      if (loadedAssets >= totalAssets && mountRef.current) {
        // Initialize clock at load complete
        mainClock = new ThreeClock();

        // Add to DOM
        mountRef.current.appendChild(renderer.domElement);

        // Start fireworks
        for (let i = 0; i < 4; i++) { // fewer initial
          setTimeout(launchRandomFirework, Math.random() * 1000);
        }

        fireworkIntervalId = setInterval(() => {
          if (Math.random() > 0.5) launchRandomFirework(); // less frequent
        }, 1200);

        // Start animation
        animate();
        clearInterval(readyCheckInterval);

      

        // Add resize listener
        window.addEventListener("resize", handleResize);
      }
    };

    const readyCheckInterval = setInterval(checkIfReady, 100);

    // Cleanup
    return () => {
      clearInterval(readyCheckInterval);
      if (fireworkIntervalId) clearInterval(fireworkIntervalId);
      if (animationId) cancelAnimationFrame(animationId);

      window.removeEventListener("resize", handleResize);

      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose everything
      fireworks.forEach(fw => {
        if (fw.mesh.parent) scene.remove(fw.mesh);
        fw.mesh.geometry?.dispose();
        fw.mesh.material?.dispose();
      });

      stars.geometry?.dispose();
      stars.material?.dispose();

      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "100vh", position: "relative" }}>
      {loadingProgress < 1 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            color: "#fff",
            fontFamily: "'Arial', sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "30px", fontWeight: "bold" }}>
            🎉 Loading Party Scene...
          </div>
          <div style={{ fontSize: "1.1rem", marginBottom: "40px" }}>
            {Math.round(loadingProgress * 100)}% Complete
          </div>
          <div
            style={{
              width: "80%",
              maxWidth: "500px",
              height: "24px",
              background: "#333",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 0 10px rgba(255,0,255,0.5)",
            }}
          >
            <div
              style={{
                width: `${loadingProgress * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ff00ff, #ffff00, #00ffff)",
                backgroundSize: "200% 100%",
                animation: "gradientShift 1.5s ease infinite",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <style jsx>{`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              100% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}