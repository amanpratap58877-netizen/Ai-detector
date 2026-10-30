import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeLoginSphere({ isDark = true, isAuthenticating = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Main 3D Interactive Group
    const group = new THREE.Group();
    scene.add(group);

    // 2. Outer Geodesic Hologram Sphere (Icosahedron)
    const outerGeo = new THREE.IcosahedronGeometry(2.1, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x6366f1 : 0x4f46e5,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.5,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // 3. Inner Quantum Core (Octahedron with glow)
    const innerGeo = new THREE.OctahedronGeometry(1.2, 3);
    const innerMat = new THREE.MeshStandardMaterial({
      color: isAuthenticating ? 0x10b981 : (isDark ? 0x818cf8 : 0x4338ca),
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      emissive: isAuthenticating ? 0x059669 : (isDark ? 0x4f46e5 : 0x312e81),
      emissiveIntensity: isDark ? 0.8 : 0.5,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // 4. Dual Gyroscopic Orbital Quantum Rings
    const ringGeo = new THREE.TorusGeometry(2.6, 0.022, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Sky cyan
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    group.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald green
      transparent: true,
      opacity: 0.65,
    });
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber gold
      transparent: true,
      opacity: 0.5,
    });
    const ring3 = new THREE.Mesh(ringGeo, ringMat3);
    ring3.rotation.z = Math.PI / 2.5;
    group.add(ring3);

    // 5. Star-field / Swarm Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 2.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: isDark ? 0xa5b4fc : 0x4f46e5,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(isDark ? 0x818cf8 : 0x4f46e5, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x10b981, 1.8, 50);
    pointLight2.position.set(-5, -5, -2);
    scene.add(pointLight2);

    // 7. Mouse Interactivity & Parallax
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.8;
      targetY = -y * 1.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const speedMultiplier = isAuthenticating ? 2.5 : 1.0;

      // Smooth mouse damping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      group.rotation.y = mouseX + elapsedTime * 0.18 * speedMultiplier;
      group.rotation.x = mouseY + Math.sin(elapsedTime * 0.25) * 0.1;

      // Counter-rotations for rings
      ring1.rotation.z += 0.008 * speedMultiplier;
      ring2.rotation.x -= 0.009 * speedMultiplier;
      ring3.rotation.y += 0.006 * speedMultiplier;

      // Core pulsating breathing effect
      const pulse = 1 + Math.sin(elapsedTime * 2.2) * 0.06;
      innerMesh.scale.set(pulse, pulse, pulse);
      innerMesh.rotation.y -= 0.015 * speedMultiplier;

      // Particle rotation
      particles.rotation.y += 0.003 * speedMultiplier;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [isDark, isAuthenticating]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[320px] sm:min-h-[400px] flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
    />
  );
}

