// app/components/threeJs/firstexample.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // --- Core Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // A slightly off-white background

    // --- Camera ---
    // The size of the canvas (from the div style below) will determine the aspect ratio.
    const camera = new THREE.PerspectiveCamera(
      50, // Field of View (degrees) - smaller FOV means more "zoomed in"
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    // Position the camera closer to the 1x1x1 cube.
    // If the cube is at (0,0,0), and its size is 1, z=2 or z=2.5 is a good starting point.
    camera.position.set(0, 0, 2.5); // x, y, z
    camera.lookAt(0, 0, 0); // Ensure camera is looking at the center of the scene

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering on high DPI screens
    currentMount.appendChild(renderer.domElement);

    // --- Geometry & Material (1x1x1 Cube) ---
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db, // A nice blue
      roughness: 0.5,
      metalness: 0.3,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Softer ambient
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3); // Position the light
    scene.add(directionalLight);

    // --- Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.007;
      renderer.render(scene, camera);
    };
    animate();

    // --- Handle Resize (important if the parent container *could* change size) ---
    const handleResize = () => {
      if (currentMount) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial call to handleResize to set aspect ratio correctly if dimensions are already set
    handleResize();


    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      // scene.clear(); // Optional: if scene has many complex children
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '120px',  //  Small fixed width - adjust as needed
        height: '120px', //  Small fixed height - adjust as needed
      
        margin: '10px auto', // Center it if its parent is wider
        display: 'inline-block', // Allows it to sit nicely with text if needed
        // Or use 'block' if you want it on its own line, then margin auto works better.
        // If your page.tsx uses flex/grid for layout, these might not be necessary.
        position: 'relative' // Good for canvas containers
      }}
      title="Interactive 3D Cube"
    />
  );
};

export default ThreeScene;
