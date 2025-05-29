// src/components/InsertionSortVisualizer.tsx
'use client';

import React, { useRef, useEffect, useState, useMemo, CSSProperties } from 'react';
import * as THREE from 'three';

// --- Configuration ---
const BAR_WIDTH = 0.8;
const BAR_SPACING = 0.2;
const MAX_BAR_HEIGHT = 5;

const DEFAULT_COLOR = new THREE.Color(0xbdc3c7); // Light Gray for unsorted
const KEY_COLOR = new THREE.Color(0x9b59b6);     // Purple for the key element
const COMPARE_COLOR = new THREE.Color(0xf39c12); // Orange for comparison in sorted part
const SHIFT_COLOR = new THREE.Color(0x1abc9c);   // Turquoise for shifting elements
const INSERT_COLOR = new THREE.Color(0xf1c40f);  // Yellow for where key is inserted
const SORTED_COLOR = new THREE.Color(0x2ecc71);  // Green for the sorted part

const ANIMATION_DELAY_MS = 600;

// --- Insertion Sort Pseudocode ---
const INSERTION_SORT_CODE = [
  /* 0 */ "function insertionSort(arr) {",
  /* 1 */ "  let n = arr.length;",
  /* 2 */ "  for (let i = 1; i < n; i++) {",
  /* 3 */ "    let key = arr[i];",
  /* 4 */ "    let j = i - 1;",
  /* 5 */ "", // Empty line for spacing
  /* 6 */ "    // Move elements of arr[0..i-1], that are",
  /* 7 */ "    // greater than key, to one position ahead",
  /* 8 */ "    // of their current position",
  /* 9 */ "    while (j >= 0 && arr[j] > key) {",
  /* 10 */ "      arr[j+1] = arr[j]; // Shift element",
  /* 11 */ "      j = j - 1;",
  /* 12 */ "    }",
  /* 13 */ "    arr[j+1] = key; // Insert key",
  /* 14 */ "  }",
  /* 15 */ "  return arr;",
  /* 16 */ "}",
];


interface AnimationStep {
  array: number[];
  sortedBoundary: number; // Elements arr[0...sortedBoundary-1] are sorted
  keyIndex?: number;       // Index 'i' of the current 'key' element
  compareIndex?: number;   // Index 'j' being compared with key's value
  isShifting?: boolean;    // True if arr[j] is being shifted to arr[j+1]
  shiftFromIndex?: number; // Index 'j' from where value is shifted
  shiftToIndex?: number;   // Index 'j+1' to where value is shifted
  insertPosition?: number; // Index where 'key' is finally inserted
  done?: boolean;
  highlightedCodeLine?: number | number[];
}

interface InsertionSortVisualizerProps {
  initialArray?: number[];
}

function worldToScreenPosition(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
  rendererCanvas: HTMLCanvasElement
): { x: number; y: number } {
  const vector = worldPosition.clone();
  vector.project(camera);
  const x = Math.round((vector.x * 0.5 + 0.5) * rendererCanvas.clientWidth);
  const y = Math.round((vector.y * -0.5 + 0.5) * rendererCanvas.clientHeight);
  return { x, y };
}

interface CodeDisplayProps {
  codeLines: string[];
  highlightedLines?: number | number[];
  style?: CSSProperties;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ codeLines, highlightedLines, style }) => {
  const isLineHighlighted = (lineNumber: number): boolean => {
    if (highlightedLines === undefined) return false;
    if (typeof highlightedLines === 'number') return highlightedLines === lineNumber;
    return highlightedLines.includes(lineNumber);
  };
  const defaultCodeStyle: CSSProperties = {
    backgroundColor: '#282c34', color: '#abb2bf', paddingTop: '0.5em', paddingBottom: '0.5em',
    paddingLeft: '0.5em', paddingRight: '0.5em', borderRadius: '8px', fontSize: '0.85em',
    fontFamily: '"Fira Code", "Courier New", monospace', whiteSpace: 'pre',
    overflowX: 'auto', textAlign: 'left', lineHeight: '1.6', width: '100%', boxSizing: 'border-box',
  };
  return (
    <pre style={{ ...defaultCodeStyle, ...style }}>
      {codeLines.map((line, index) => (
        <code key={index} style={{
          display: 'block',
          backgroundColor: isLineHighlighted(index) ? 'rgba(255, 255, 0, 0.25)' : 'transparent',
          color: isLineHighlighted(index) ? '#e6e6e6' : '#abb2bf',
          padding: '1px 5px', borderRadius: '3px', transition: 'background-color 0.3s ease, color 0.3s ease',
        }}>
          <span style={{ display: 'inline-block', width: '2.5em', color: '#6c757d', marginRight: '1em', textAlign: 'right', userSelect: 'none' }}>
            {index + 1}
          </span>
          {line}
        </code>
      ))}
    </pre>
  );
};

const InsertionSortVisualizer: React.FC<InsertionSortVisualizerProps> = ({
  initialArray = [5, 1, 8, 4, 2, 7, 3, 6],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const labelElementsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click Start to visualize Insertion Sort");

  const animationSteps = useMemo(() => {
    const arr = [...initialArray];
    const steps: AnimationStep[] = [];
    const n = arr.length;
    let localArr = [...arr];

    steps.push({ array: [...localArr], sortedBoundary: 0, highlightedCodeLine: [0, 1, 16] }); // Initial state

    for (let i = 1; i < n; i++) {
      steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, highlightedCodeLine: 2 }); // Outer loop, select key
      let key = localArr[i];
      steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, highlightedCodeLine: 3 }); // key = arr[i]
      let j = i - 1;
      steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, highlightedCodeLine: 4 }); // j = i - 1

      // Step to show the comparison setup before while loop
      if (j >= 0) {
         steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, highlightedCodeLine: [6,7,8,9] });
      }


      while (j >= 0 && localArr[j] > key) {
        steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, isShifting: true, shiftFromIndex: j, shiftToIndex: j + 1, highlightedCodeLine: 10 }); // Shifting element
        localArr[j + 1] = localArr[j];
        steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, isShifting: false, shiftFromIndex: j, shiftToIndex: j + 1, highlightedCodeLine: 10 }); // Array after shift

        j = j - 1;
        steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, highlightedCodeLine: 11 }); // j = j - 1

        // Step to show next comparison setup or end of while
        if (j >= 0) {
            steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, compareIndex: j, highlightedCodeLine: 9 }); // Loop condition check
        }
      }
      steps.push({ array: [...localArr], sortedBoundary: i, keyIndex: i, insertPosition: j + 1, highlightedCodeLine: 12 }); // End of while loop (or condition false)

      localArr[j + 1] = key;
      steps.push({ array: [...localArr], sortedBoundary: i + 1, keyIndex: i, insertPosition: j + 1, highlightedCodeLine: 13 }); // Insert key
    }
    steps.push({ array: [...localArr], sortedBoundary: n, done: true, highlightedCodeLine: [14, 15, 16] }); // Final sorted state
    return steps;
  }, [initialArray]);

  const updateLabelPositions = () => {
    if (!cameraRef.current || !rendererRef.current || !labelsContainerRef.current) return;
    const camera = cameraRef.current;
    const rendererCanvas = rendererRef.current.domElement;
    meshesRef.current.forEach((mesh, index) => {
      const label = labelElementsRef.current[index];
      if (mesh && label && mesh.geometry) {
        const barTopPosition = new THREE.Vector3(
          mesh.position.x,
          mesh.position.y + (mesh.geometry as THREE.BoxGeometry).parameters.height / 2 + 0.3,
          mesh.position.z
        );
        const screenPos = worldToScreenPosition(barTopPosition, camera, rendererCanvas);
        label.style.left = `${screenPos.x}px`;
        label.style.top = `${screenPos.y}px`;
      }
    });
  };

  useEffect(() => {
    if (!mountRef.current || !labelsContainerRef.current || rendererRef.current) return;
    const currentMount = mountRef.current;
    const currentLabelsContainer = labelsContainerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);
    sceneRef.current = scene;
    const numBars = initialArray.length;
    const totalWidth = numBars * BAR_WIDTH + (numBars - 1) * BAR_SPACING;
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(totalWidth / 2 - (BAR_WIDTH / 2 + BAR_SPACING / 2), MAX_BAR_HEIGHT / 1.5, MAX_BAR_HEIGHT * 1.2);
    camera.lookAt(totalWidth / 2 - (BAR_WIDTH / 2 + BAR_SPACING / 2), MAX_BAR_HEIGHT / 2, 0);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); directionalLight.position.set(5, 10, 7.5); scene.add(directionalLight);
    const maxValue = Math.max(...initialArray, 1);
    meshesRef.current = initialArray.map((value, index) => {
      const height = (value / maxValue) * MAX_BAR_HEIGHT;
      const geometry = new THREE.BoxGeometry(BAR_WIDTH, height, BAR_WIDTH);
      const material = new THREE.MeshStandardMaterial({ color: DEFAULT_COLOR.getHex() });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.height = height;
      mesh.position.x = index * (BAR_WIDTH + BAR_SPACING);
      mesh.position.y = height / 2;
      scene.add(mesh);
      const label = document.createElement('span');
      label.textContent = String(value);
      label.style.position = 'absolute'; label.style.color = 'white'; label.style.backgroundColor = 'rgba(0,0,0,0.5)';
      label.style.padding = '2px 5px'; label.style.borderRadius = '3px'; label.style.fontSize = '12px';
      label.style.pointerEvents = 'none'; label.style.transform = 'translate(-50%, -50%)'; label.style.whiteSpace = 'nowrap';
      currentLabelsContainer.appendChild(label);
      labelElementsRef.current[index] = label;
      return mesh;
    });
    updateLabelPositions();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      updateLabelPositions();
    };
    animate();
    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        const width = currentMount.clientWidth; const height = currentMount.clientHeight;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height; cameraRef.current.updateProjectionMatrix();
        updateLabelPositions();
      }
    };
    window.addEventListener('resize', handleResize); handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      labelElementsRef.current.forEach(label => label?.remove()); labelElementsRef.current = [];
      meshesRef.current.forEach(mesh => { scene.remove(mesh); mesh.geometry.dispose(); if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose()); else mesh.material.dispose(); });
      meshesRef.current = [];
      if (rendererRef.current && currentMount && rendererRef.current.domElement.parentNode === currentMount) { currentMount.removeChild(rendererRef.current.domElement); }
      rendererRef.current?.dispose(); rendererRef.current = null; sceneRef.current = null; cameraRef.current = null;
    };
  }, [initialArray]);

  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= animationSteps.length || !meshesRef.current.length) {
      if (currentStepIndex === -1 && meshesRef.current.length > 0) {
        const maxValue = Math.max(...initialArray, 1);
        initialArray.forEach((value, index) => {
          if (meshesRef.current[index]) {
            const mesh = meshesRef.current[index]; const targetHeight = (value / maxValue) * MAX_BAR_HEIGHT;
            mesh.geometry.dispose(); mesh.geometry = new THREE.BoxGeometry(BAR_WIDTH, targetHeight, BAR_WIDTH);
            mesh.position.y = targetHeight / 2; mesh.userData.height = targetHeight;
            (mesh.material as THREE.MeshStandardMaterial).color.set(DEFAULT_COLOR);
            if (labelElementsRef.current[index]) labelElementsRef.current[index]!.textContent = String(value);
          }
        });
        updateLabelPositions();
      } return;
    }

    const step = animationSteps[currentStepIndex];
    const maxValue = Math.max(...step.array, 1);
    setStatusMessage(step.done ? "Sorting Complete!" : `Inserting element (key)...`);

    meshesRef.current.forEach((mesh, index) => {
      const value = step.array[index];
      const targetHeight = (value / maxValue) * MAX_BAR_HEIGHT;

      if (mesh.userData.height !== targetHeight) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.BoxGeometry(BAR_WIDTH, targetHeight, BAR_WIDTH);
        mesh.position.y = targetHeight / 2;
        mesh.userData.height = targetHeight;
      }

      let targetColor = DEFAULT_COLOR;
      if (step.done || index < step.sortedBoundary) {
        targetColor = SORTED_COLOR;
      }
      if (index === step.keyIndex) {
        targetColor = KEY_COLOR;
      }
      if (index === step.compareIndex) {
        targetColor = COMPARE_COLOR;
      }
      if (step.isShifting && index === step.shiftToIndex) {
        targetColor = SHIFT_COLOR; // Element that received the shifted value
      }
       if (step.isShifting && index === step.shiftFromIndex) {
        // Optionally, color the element whose value is being shifted from differently,
        // or keep it as COMPARE_COLOR if it was just compared.
        // For now, let COMPARE_COLOR take precedence if it's also compareIndex.
        if (targetColor === DEFAULT_COLOR || targetColor === SORTED_COLOR) targetColor = COMPARE_COLOR; // Or a specific "being shifted from" color
      }
      if (index === step.insertPosition) {
        targetColor = INSERT_COLOR;
      }


      (mesh.material as THREE.MeshStandardMaterial).color.set(targetColor);
      if (labelElementsRef.current[index]) {
        labelElementsRef.current[index]!.textContent = String(value);
      }
    });
    updateLabelPositions();
  }, [currentStepIndex, animationSteps, initialArray]);

  useEffect(() => {
    if (isPlaying && currentStepIndex < animationSteps.length - 1) {
      const timer = setTimeout(() => setCurrentStepIndex(prevIndex => prevIndex + 1), ANIMATION_DELAY_MS);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStepIndex >= animationSteps.length - 1) {
      setIsPlaying(false); setStatusMessage("Sorting Complete!");
    }
  }, [isPlaying, currentStepIndex, animationSteps.length]);

  const handleStart = () => { if (currentStepIndex >= animationSteps.length - 1) setCurrentStepIndex(0); setIsPlaying(true); setStatusMessage("Sorting started..."); };
  const handlePause = () => { setIsPlaying(false); setStatusMessage("Paused."); };
  const handleReset = () => { setIsPlaying(false); setCurrentStepIndex(-1); setStatusMessage("Click Start."); };
  const handleNextStep = () => { if (currentStepIndex < animationSteps.length - 1) { setIsPlaying(false); setCurrentStepIndex(prev => prev + 1); }};
  const handlePrevStep = () => { if (currentStepIndex > 0) { setIsPlaying(false); setCurrentStepIndex(prev => prev - 1); }};

  const highlightedCode = animationSteps[currentStepIndex]?.highlightedCodeLine;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
      <h2 style={{ textAlign: 'center', color: '#ecf0f1', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Insertion Sort Visualization
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', width: '100%' }}>
          <div style={{ flex: '1 1 550px', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', minHeight: '300px', maxHeight: '450px' }}>
              <div ref={mountRef} style={{ width: '100%', height: '100%', border: '1px solid #7f8c8d', borderRadius: '8px', backgroundColor: '#34495e' }} />
              <div ref={labelsContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            </div>
            <div style={{ textAlign: 'center', color: '#bdc3c7', minHeight: '2em' }}>{statusMessage}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={handleStart} disabled={isPlaying && currentStepIndex < animationSteps.length -1} style={buttonStyle}>
                {currentStepIndex >= animationSteps.length -1 && !isPlaying ? 'Replay' : 'Start / Resume'}
              </button>
              <button onClick={handlePause} disabled={!isPlaying} style={buttonStyle}>Pause</button>
              <button onClick={handlePrevStep} disabled={isPlaying || currentStepIndex <= 0} style={buttonStyle}>Prev Step</button>
              <button onClick={handleNextStep} disabled={isPlaying || currentStepIndex >= animationSteps.length - 1} style={buttonStyle}>Next Step</button>
              <button onClick={handleReset} style={buttonStyle}>Reset</button>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', minWidth: '300px', maxHeight: '550px', display: 'flex', flexDirection: 'column' }}>
            <CodeDisplay
              codeLines={INSERTION_SORT_CODE}
              highlightedLines={highlightedCode}
              style={{ flexGrow: 1, overflowY: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const buttonStyle: CSSProperties = {
  padding: '10px 15px', fontSize: '0.9rem', color: 'white', backgroundColor: '#3498db',
  border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.3s ease',
};

export default InsertionSortVisualizer;
