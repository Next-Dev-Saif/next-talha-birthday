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
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  Vector2,
  DoubleSide,
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
  MeshPhysicalMaterial,
  DirectionalLight,
  Raycaster,
  Group,
  BoxGeometry,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
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
    const defaultCameraPos = camera.position.clone();

  

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for performance
    renderer.outputColorSpace = "srgb"; // Modern color space

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxZoom = 1;
    controls.maxDistance = 10;
    controls.maxPolarAngle=(Math.PI/180)*90;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Postprocessing composer (declared here so animate/checkIfReady can access)
    let composer = null;

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

    // ===== Roller Coaster Tube & Tour =====
    // Create a CatmullRom path and a tube mesh to visualize the ride
    // Sky roller-coaster path with ups and downs
    const pathPoints = [
      new Vector3(0, 8, 20),
      new Vector3(8, 12, 8),
      new Vector3(12, 16, -4),
      new Vector3(6, 18, -16),
      new Vector3(0, 14, -24),
      new Vector3(-8, 10, -16),
      new Vector3(-12, 12, -2),
      new Vector3(-10, 16, 10),
      new Vector3(-2, 20, 18),
      new Vector3(0, 14, 10),
    ];
    const rail = new CatmullRomCurve3(pathPoints, true, 'catmullrom', 0.2);

    const tubeGeo = new TubeGeometry(rail, 600, 1.0, 28, true);
    const tubeMat = new MeshPhysicalMaterial({ color: "black",side:DoubleSide,metalness:0.5,reflectivity:1});
    const tube = new Mesh(tubeGeo, tubeMat);
    tube.userData.isTourAsset = true;
    scene.add(tube);
    // Shiny tunnel feel: add inner additive glow cylinders along path (simple approximation)

    // Waypoint helper planes (images) to show during tour
    const waypointBanners = [];
    const createWaypointBanner = (src, position, lookAt = new Vector3(0, 1, 0)) => {
      const geo = new PlaneGeometry(2.2, 3.2);
      const mat = new MeshBasicMaterial({ toneMapped: false, side:DoubleSide });
      const mesh = new Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.lookAt(lookAt);
      mesh.userData.isTourAsset = true;
      scene.add(mesh);
      loader.load(src, (tex) => { mat.map = tex; mat.needsUpdate = true; });
      waypointBanners.push(mesh);
      return mesh;
    };

    // Create three image waypoints near dancer-1, dancer-2, and near cake
    // Place images initially in the sky near the path; they'll be moved in front at stops
    const img1 = createWaypointBanner('/talha-photos/photo-1.jpg', new Vector3(2, 16, 8), new Vector3(0, 16, 8));
    const img2 = createWaypointBanner('/talha-photos/photo-2.jpg', new Vector3(-2, 14, -8), new Vector3(0, 14, -8));
    const img3 = createWaypointBanner('/talha-photos/photo-3.jpg', new Vector3(0, 18, -2), new Vector3(0, 18, 0));

    // helper to place current banner directly in front of camera when holding
    const shoveBannerInFront = (mesh) => {
      if (!mesh) return;
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      const pos = camera.position.clone().add(forward.multiplyScalar(2.8));
      mesh.position.copy(pos);
      mesh.lookAt(camera.position.clone().add(forward));
    };

    // Tour state
    let isTourActive = true;
    let tourStartTimeMs = null;
    let tourT = 0; // 0..1 along the rail
    const segmentStops = [
      { t: 0.18, holdMs: 3000 }, // dancer-1 + img1 (sky)
      { t: 0.52, holdMs: 3000 }, // dancer-2 + img2
      { t: 0.82, holdMs: 3000 }, // cake + img3
      { t: 0.98, holdMs: 1200 }, // end
    ];
    let currentStopIndex = 0;
    let atStopSince = null;

    // Utility to position camera on tube with a small inner radius offset
    const setCameraOnRail = (tNorm) => {
      const pos = rail.getPointAt(tNorm);
      const tangent = rail.getTangentAt(tNorm).normalize();
      const up = new Vector3(0, 1, 0);
      const binormal = new Vector3().crossVectors(up, tangent).normalize();
      // keep camera slightly inside tube
      const offset = binormal.clone().multiplyScalar(0.15);
      camera.position.copy(pos.clone().sub(offset));
    };
    // Mixers and main asset refs
    const mixers = [];
    const dancers = [];
    const dancerActions = [];
    let cakeModel = null;

    // Load models
    loadModel("/cake.glb", {
      position: [0, 0, 5],
      scale: [0.005, 0.005, 0.005],
    }).then(({ model }) => {
      scene.add(model);
      cakeModel = model;
      updateProgress();
    }).catch(() => updateProgress());

    const dancerConfigs = [
      { position: [3, 0, 0], animationIndex: 1 },
      { position: [-3, 0, 0], animationIndex: 2 },
      { position: [0, 0, 1], animationIndex: 3 },
    ];

    dancerConfigs.forEach((config) => {
      loadModel("/Dancer.glb", {
        ...config,
        scale: [1.1, 1.1, 1.1],
      }).then(({ model, mixer, clock, actions }) => {
        scene.add(model);
        dancers.push(model);
        if (actions) dancerActions.push(actions);
        if (mixer && clock) mixers.push({ mixer, clock });
        updateProgress();
      }).catch(() => updateProgress());
    });

    // ===== Staged Virtual Party Experience =====
    const STAGES = { BALLOONS: 1, DANCE: 2, WISH: 3, FINALE: 4 };
    let currentStage = STAGES.BALLOONS;
    let stageCompleted = false;

    // UI root
    const uiRoot = document.createElement('div');
    uiRoot.style.position = 'absolute';
    uiRoot.style.top = '0';
    uiRoot.style.left = '0';
    uiRoot.style.width = '100%';
    uiRoot.style.height = '100%';
    uiRoot.style.pointerEvents = 'none';
    uiRoot.style.zIndex = '20';
    const mountUI = () => { if (mountRef.current && !uiRoot.parentElement) mountRef.current.appendChild(uiRoot); };
    const clearUI = () => { uiRoot.innerHTML = ''; };

    // Inject party styles once for UI elements
    let partyStylesInjected = false;
    const ensurePartyStyles = () => {
      if (partyStylesInjected) return;
      const style = document.createElement('style');
      style.textContent = `
        .party-panel { backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(255,0,255,0.25); border: 1px solid rgba(255,255,255,0.15); }
        .party-title { font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 2px 12px rgba(0,0,0,0.35); }
        .party-sub { opacity: 0.9; }
        .neon-border { position: relative; }
        .neon-border::before { content: ''; position: absolute; inset: -2px; border-radius: 14px; background: linear-gradient(135deg,rgb(182, 0, 182),rgb(167, 0, 128),rgb(167, 7, 196)); filter: blur(8px); z-index: -1; opacity: 0.9; }
        .emote-btn { transition: transform 0.12s ease, box-shadow 0.12s ease; box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
        .emote-btn:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 10px 24px rgba(255,0,255,0.35); }
        .cta-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .cta-btn:hover { transform: translateY(-1px) scale(1.03); box-shadow: 0 10px 24px rgba(0,255,255,0.35); }
        @keyframes floaty { 0%{ transform: translateY(0); } 50%{ transform: translateY(-6px); } 100%{ transform: translateY(0); } }
      `;
      document.head.appendChild(style);
      partyStylesInjected = true;
    };

    // Stage 1: Balloons
    const balloonsGroup = new Group();
    balloonsGroup.visible = false;
    scene.add(balloonsGroup);
    const spawnBalloons = (count=20) => {
      while (balloonsGroup.children.length) balloonsGroup.remove(balloonsGroup.children[0]);
      for (let i=0;i<count;i++){
        const s = new Mesh(new SphereGeometry(0.25, 20, 20), new MeshBasicMaterial({ color: 0xff66cc }));
        s.position.set((Math.random()-0.5)*4, 1 + Math.random()*2.5, (Math.random()-0.5)*4);
        s.userData.isBalloon = true;
        balloonsGroup.add(s);
      }
    };
    let balloonsBurst = 0;
   

    // Stage 2
    let dancesDone = 0;

    // Stage 3
    let wishSubmitted = false;

    const setStageVisibility = (stage) => {
      balloonsGroup.visible = false;
      waypointBanners.forEach(b => b.visible = false);
      if (stage === STAGES.BALLOONS) balloonsGroup.visible = true;
      if (stage === STAGES.FINALE) waypointBanners.forEach(b => b.visible = true);
    };

    // Helper: place any Object3D in front of camera
    const placeInFrontOfCamera = (obj, distance = 3) => {
      if (!obj) return;
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      const targetPos = camera.position.clone().add(forward.multiplyScalar(distance));
      obj.position.copy(targetPos);
     
      obj.lookAt(camera.position.clone().add(forward));
      camera.position.y=camera.position.y+3;
      camera.position.z=camera.position.z+2;
      camera.lookAt(obj?.position);
      
    };

    const showStage1UI = () => {
      clearUI();
      ensurePartyStyles();
      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.top = '20px';
      box.style.left = '50%';
      box.style.transform = 'translateX(-50%)';
      box.style.background = 'linear-gradient(135deg, rgba(172,4,77,0.9), rgba(255,0,128,0.8))';
      box.style.color = '#fff';
      box.style.padding = '14px 20px';
      box.style.borderRadius = '12px';
      box.style.pointerEvents = 'auto';
      box.style.fontWeight = '700';
      box.style.fontSize = '15px';
      box.style.textAlign = 'center';
      box.style.boxShadow = '0 8px 24px rgba(172,4,77,0.4)';
      box.style.border = '1px solid rgba(255,255,255,0.2)';
      box.innerHTML = '<div style="font-size: 16px; margin-bottom: 4px;">🎈 Stage 1 · Balloon Pop</div><div style="font-size: 13px; opacity: 0.9;">Burst 5 balloons by clicking on them!</div>';
      uiRoot.appendChild(box);
    };

    const showStage2UI = () => {
      clearUI();
      ensurePartyStyles();
      const panel = document.createElement('div');
      panel.style.position = 'absolute';
      panel.style.bottom = '24px';
      panel.style.left = '50%';
      panel.style.transform = 'translateX(-50%)';
      panel.style.background = 'linear-gradient(180deg, rgba(32,12,52,0.85), rgba(18,10,30,0.9))';
      panel.style.padding = '16px 18px';
      panel.style.borderRadius = '14px';
      panel.style.pointerEvents = 'auto';
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      panel.style.alignItems = 'center';
      panel.style.gap = '12px';
      panel.className = 'party-panel neon-border';

      const title = document.createElement('div');
      title.textContent = 'Stage 2 · Dance Emotes';
      title.style.color = '#fff';
      title.style.fontSize = '16px';
      title.className = 'party-title';

      const sub = document.createElement('div');
      sub.textContent = 'Tap emotes to trigger dances. Do 10 to unlock the next stage!';
      sub.style.color = "white";
      sub.style.fontSize = '13px';
      sub.className = 'party-sub';

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '10px';

      // Map emotes to animation indices 0..n-1
      const emotes = [
        { icon: '💃', anim: 0 },
        { icon: '🕺', anim: 1 },
        { icon: '🎶', anim: 2 },
        { icon: '✨', anim: 3 },
      ];
      emotes.forEach((cfg)=>{
        const btn = document.createElement('button');
        btn.textContent = cfg.icon;
        btn.style.fontSize = '22px';
        btn.style.padding = '10px 12px';
        btn.style.borderRadius = '10px';
        btn.style.border = '1px solid rgba(255,255,255,0.15)';
        btn.style.cursor = 'pointer';
        btn.style.background = 'linear-gradient(135deg, rgb(150, 0, 150), rgba(117, 0, 98, 0.99))';
        btn.style.color = '#fff';
        btn.className = 'emote-btn';
        btn.onclick = ()=>{
          // trigger dancer animation if available
          const actions = dancerActions[0];
          if (actions && actions[cfg.anim]) {
            actions.forEach(a=>{ try{ a.stop(); }catch(e){} });
            try { actions[cfg.anim].reset().play(); } catch(err){}
          }
          dancesDone++;
          if (dancesDone >= 10) nextStage();
        };
        row.appendChild(btn);
      });
      panel.appendChild(title);
      panel.appendChild(sub);
      panel.appendChild(row);
      uiRoot.appendChild(panel);
    };

    const showStage3UI = () => {
      clearUI();
      ensurePartyStyles();
      const wrap = document.createElement('div');
      wrap.style.position = 'absolute';
      wrap.style.bottom = '24px';
      wrap.style.left = '50%';
      wrap.style.transform = 'translateX(-50%)';
      wrap.style.background = 'linear-gradient(180deg, rgba(18,10,30,0.92), rgba(32,12,52,0.88))';
      wrap.style.padding = '16px 18px';
      wrap.style.borderRadius = '14px';
      wrap.style.pointerEvents = 'auto';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '10px';
      wrap.className = 'party-panel neon-border';

      const title = document.createElement('div');
      title.textContent = 'Stage 3 · Send Your Birthday Wish';
      title.style.color = '#fff';
      title.style.fontSize = '16px';
      title.className = 'party-title';

      const sub = document.createElement('div');
      sub.textContent = 'Write a heartfelt message and press Send to celebrate!';
      sub.style.color = 'white';
      sub.style.fontSize = '13px';
      sub.className = 'party-sub';

      const input = document.createElement('input');
      input.placeholder = 'Enter your wish...';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '10px';
      input.style.border = '1px solid rgba(255,255,255,0.18)';
      input.style.background = 'rgba(255,255,255,0.08)';
      input.style.color = '#fff';
      input.style.width = '260px';
      input.style.outline = 'none';

      const btn = document.createElement('button');
      btn.textContent = 'Send Wish';
      btn.style.marginLeft = '0px';
      btn.style.marginTop = '6px';
      btn.style.padding = '10px 14px';
      btn.style.borderRadius = '10px';
      btn.style.border = '1px solid rgba(255,255,255,0.15)';
      btn.style.cursor = 'pointer';
      btn.style.background = 'linear-gradient(135deg, #ff00ff, #00ffff)';
      btn.style.color = '#0b0420';
      btn.className = 'cta-btn';
      btn.onclick = ()=>{ 
        wishSubmitted = true; 
        // stop tour and reset camera/orbit to defaults
        isTourActive = false;
        currentStopIndex = segmentStops.length;
        controls.target.set(0,0,0);
        camera.position.copy(defaultCameraPos);
        camera.lookAt(new Vector3(0,0,0));
        controls.update();
        nextStage(); 
      };
      wrap.appendChild(title);
      wrap.appendChild(sub);
      wrap.appendChild(input);
      wrap.appendChild(btn);
      uiRoot.appendChild(wrap);
    };

    const showStage4UI = () => {
      clearUI();
      ensurePartyStyles();
      const msg = document.createElement('div');
      msg.style.position = 'absolute';
      msg.style.top = '20px';
      msg.style.left = '50%';
      msg.style.transform = 'translateX(-50%)';
      msg.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,140,0,0.8))';
      msg.style.color = '#0b0420';
      msg.style.padding = '14px 20px';
      msg.style.borderRadius = '12px';
      msg.style.pointerEvents = 'none';
      msg.style.fontWeight = '700';
      msg.style.fontSize = '15px';
      msg.style.textAlign = 'center';
      msg.style.boxShadow = '0 8px 24px rgba(255,215,0,0.4)';
      msg.style.border = '1px solid rgba(255,255,255,0.3)';
      msg.innerHTML = '<div style="font-size: 16px; margin-bottom: 4px;">🎆 Stage 4 · Finale</div><div style="font-size: 13px; opacity: 0.8;">Enjoy the fireworks and photos!</div>';
      uiRoot.appendChild(msg);
    };

    const enterStage = (stage) => {
      currentStage = stage;
      stageCompleted = false;
      setStageVisibility(stage);
      mountUI();
      if (stage === STAGES.BALLOONS){ spawnBalloons(24); balloonsBurst = 0; showStage1UI(); placeInFrontOfCamera(balloonsGroup, 3.2); }
      else if (stage === STAGES.DANCE){ dancesDone = 0; showStage2UI(); if (dancers[0]) placeInFrontOfCamera(dancers[0], 3.5); }
      else if (stage === STAGES.WISH){ showStage3UI(); if (cakeModel) placeInFrontOfCamera(cakeModel, 3.5); spawnFireworksInFront(8,7);}
      else if (stage === STAGES.FINALE){ showStage4UI(); spawnFireworksInFront(12,10); setTimeout(()=>{ clearUI(); }, 3000);
    // Reset to default camera and orbit at origin for user control
    camera.position.copy(defaultCameraPos);
    controls.target.set(0,0,0);
    camera.lookAt(new Vector3(0,0,0));
    controls.update();
    }
    };

    const nextStage = () => {
      if (currentStage === STAGES.BALLOONS) enterStage(STAGES.DANCE);
      else if (currentStage === STAGES.DANCE) enterStage(STAGES.WISH);
      else if (currentStage === STAGES.WISH) enterStage(STAGES.FINALE);
      else if (currentStage === STAGES.FINALE) { clearUI(); }
    };

    // Map current tour stop index to stage
    const getStageForStop = (idx) => {
      if (idx === 0) return STAGES.BALLOONS;
      if (idx === 1) return STAGES.DANCE;
      if (idx === 2) return STAGES.WISH;
      if (idx >= 3) return STAGES.FINALE;
      return null;
    };

    let activeStageStopIdx = -1;

    // Raycast for balloons
    const raycaster = new Raycaster();
    const mouse = { x:0, y:0 };
    const onClick = (ev) => {
      if (currentStage !== STAGES.BALLOONS) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(balloonsGroup.children, false);
      if (intersects.length){
        const hit = intersects[0].object;
        balloonsGroup.remove(hit);
        balloonsBurst++;
        if (balloonsBurst >= 5) { stageCompleted = true; nextStage(); }
      }
    };
    renderer.domElement.addEventListener('click', onClick);

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

    const spawnFireworksInFront = (count = 6, distance = 6) => {
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      const base = camera.position.clone().add(forward.multiplyScalar(distance));
      for (let i = 0; i < count; i++) {
        const jitter = new Vector3((Math.random()-0.5)*2, (Math.random())*2, (Math.random()-0.5)*2);
        const p = base.clone().add(jitter);
        createFirework(p.x, p.y, p.z);
      }
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
        cone.lookAt(0, 0, -3);
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

      // Camera-on-rails tour
      if (isTourActive) {
        if (tourStartTimeMs === null) tourStartTimeMs = performance.now();

        const speed = 0.04; // normalized units per second
        // progress tour if not holding at stop
        if (currentStopIndex < segmentStops.length) {
          const stop = segmentStops[currentStopIndex];
          // If a stage is active (between atStopSince set and completion), hold position
          const holdingStage = atStopSince !== null && !stageCompleted;
          if (tourT < stop.t && atStopSince === null) {
            tourT = Math.min(stop.t, tourT + speed * (1 / 60));
          } else {
            // reached or passed stop
            tourT = stop.t;
            if (atStopSince === null) atStopSince = performance.now();
            const held = performance.now() - atStopSince;
            // stage activation when entering a stop
            if (activeStageStopIdx !== currentStopIndex) {
              const stageForThisStop = getStageForStop(currentStopIndex);
              if (stageForThisStop) enterStage(stageForThisStop);
              activeStageStopIdx = currentStopIndex;
            }
            if (!holdingStage && held >= stop.holdMs) {
              // next segment
              currentStopIndex++;
              atStopSince = null;
              stageCompleted = false; // reset for next stage
            }
          }
        } else {
          // tour finished
          isTourActive = false;
          // cleanup tour-only assets and keep scene as-is
          scene.remove(tube);
          tube.geometry.dispose();
          tube.material.dispose();
          waypointBanners.forEach((b) => {
            if (b.parent) scene.remove(b);
            b.geometry.dispose();
            b.material.map?.dispose?.();
            b.material.dispose();
          });
        }

        if (isTourActive) {
          // Only snap to rail while cruising or entering a stop (not while stage active)
          const holdingStage = atStopSince !== null && !stageCompleted;
          if (!holdingStage) setCameraOnRail(tourT);
          // Look slightly ahead along the path. During holds, still look ahead inside tunnel
          const lookAheadT = Math.min(0.9999, tourT + (atStopSince ? 0.02 : 0.01));
          let lookPos = rail.getPointAt(lookAheadT);
          if (!lookPos) lookPos = camera.position.clone().add(new Vector3(0, 0, -1));
          camera.lookAt(lookPos);

          // camera bounce + FOV pulse while holding to emulate concert punch
          if (atStopSince) {
            const held = (performance.now() - atStopSince) / 1000;
            const bounce = Math.sin(held * 10) * 0.03;
            camera.position.y += bounce;
            const baseFov = 60;
            camera.fov = baseFov + Math.sin(held * 4) * 2.5;
            camera.updateProjectionMatrix();

            // bring related banner in front when holding
            const activeIdx = Math.min(currentStopIndex, segmentStops.length - 1);
            if (activeIdx === 0) shoveBannerInFront(img1);
            if (activeIdx === 1) shoveBannerInFront(img2);
            if (activeIdx === 2) shoveBannerInFront(img3);
            // Keep stage groups in front while stage active
            if (!stageCompleted) {
              if (currentStage === STAGES.BALLOONS) placeInFrontOfCamera(balloonsGroup, 3.2);
              if (currentStage === STAGES.DANCE && dancers[0]) placeInFrontOfCamera(dancers[0], 3.5);
              if (currentStage === STAGES.WISH && cakeModel) placeInFrontOfCamera(cakeModel, 3.5);
            }
          } else {
            // reset FOV when cruising
            if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
          }
        }
      }

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

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    };

    // Start everything when loaded
    const checkIfReady = () => {
      if (loadedAssets >= totalAssets && mountRef.current) {
        // Initialize clock at load complete
        mainClock = new ThreeClock();

        // Add to DOM
        mountRef.current.appendChild(renderer.domElement);

        // Composer with bloom
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        const size = new Vector2(window.innerWidth, window.innerHeight);
        const bloom = new UnrealBloomPass(size, 1.2, 0.8, 0.85);
        composer.addPass(renderPass);
        composer.addPass(bloom);

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
        window.addEventListener("keydown",handleResize);
        window.addEventListener("keypress",handleResize);
        window.addEventListener("touchstart",handleResize);
        
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