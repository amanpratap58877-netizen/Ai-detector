import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ThreeScoreVisualizer({ aiPercentage = 32, humanPercentage = 68, isDark = false }) {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Color decisions based on score
    const isAiHeavy = aiPercentage > 60;
    const isMixed = aiPercentage >= 30 && aiPercentage <= 60;

    const primaryColor = isAiHeavy ? 0xf59e0b : isMixed ? 0xf59e0b : 0x10b981;
    const secondaryColor = isAiHeavy ? 0xef4444 : isMixed ? 0x10b981 : 0x059669;

    // 1. 3D Crystal Polyhedron Core
    const coreGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
      emissive: primaryColor,
      emissiveIntensity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // 2. Inner Floating Core
    const innerGeo = new THREE.IcosahedronGeometry(0.7, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    rootGroup.add(innerMesh);

    // 3. Dual Equatorial 3D Orbit Rings
    const ringGeo = new THREE.TorusGeometry(1.65, 0.02, 16, 80);
    const ringMatAI = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.7,
    });
    const ringAI = new THREE.Mesh(ringGeo, ringMatAI);
    ringAI.rotation.x = Math.PI / 4;
    rootGroup.add(ringAI);

    const ringMatHuman = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
    });
    const ringHuman = new THREE.Mesh(ringGeo, ringMatHuman);
    ringHuman.rotation.y = Math.PI / 4;
    rootGroup.add(ringHuman);

    // 4. Vertex Data Nodes
    const nodesCount = 14;
    const nodesGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);

    for (let i = 0; i < nodesCount; i++) {
      const angle = (i / nodesCount) * Math.PI * 2;
      const radius = 1.65;
      const isNodeAi = i < Math.round((aiPercentage / 100) * nodesCount);

      const nodeMat = new THREE.MeshBasicMaterial({
        color: isNodeAi ? 0xf59e0b : 0x10b981,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      nodesGroup.add(nodeMesh);
    }
    ringAI.add(nodesGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(primaryColor, 3, 20);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);

    // Mouse Interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rootGroup.rotation.y += dx * 0.015;
      rootGroup.rotation.x += dy * 0.015;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (!isDragging) {
        rootGroup.rotation.y += 0.008;
        rootGroup.rotation.x += 0.003;
      }

      innerMesh.rotation.y -= 0.015;
      innerMesh.rotation.z += 0.01;

      // Pulse
      const scale = 1 + Math.sin(time * 3) * 0.03;
      coreMesh.scale.set(scale, scale, scale);

      ringAI.rotation.z += 0.01;
      ringHuman.rotation.z -= 0.008;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMatAI.dispose();
      ringMatHuman.dispose();
      nodeGeo.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [aiPercentage, humanPercentage, isDark]);

  return (
    <div className="relative w-56 h-56 mx-auto flex items-center justify-center select-none">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        title="Interactive 3D Score Orb — Click and drag to inspect in 3D"
      />

      {/* Central 3D Overlay Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight backdrop-blur-[2px] px-2 py-0.5 rounded-lg bg-white/40 dark:bg-navy-900/40">
          {aiPercentage}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          3D AI Signal
        </span>
      </div>
    </div>
  );
}
