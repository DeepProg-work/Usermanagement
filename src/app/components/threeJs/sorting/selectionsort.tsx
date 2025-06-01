// src/components/SelectionSortVisualizer.tsx
'use client';

import React, { useRef, useEffect, useState, useMemo, CSSProperties } from 'react';
import * as THREE from 'three';

// --- Configuration ---
const BAR_WIDTH = 0.8;
const BAR_SPACING = 0.2;
const MAX_BAR_HEIGHT = 5;

const DEFAULT_COLOR = new THREE.Color(0xbdc3c7); // Light Gray for unsorted
const MIN_VAL_COLOR = new THREE.Color(0x9b59b6);  // Purple for current minimum value in pass
const SCAN_COLOR = new THREE.Color(0xf39c12);    // Orange for element being scanned/compared
const SWAP_COLOR = new THREE.Color(0xe74c3c);    // Red for elements being swapped
const SORTED_COLOR = new THREE.Color(0x2ecc71);  // Green for the sorted part

const ANIMATION_DELAY_MS = 600;

// --- Selection Sort Pseudocode ---
const SELECTION_SORT_PSEUDO_CODE = [
  /* 0 */ "function selectionSort(arr) {",
  /* 1 */ "  let n = arr.length;",
  /* 2 */ "  for (let i = 0; i < n - 1; i++) {",
  /* 3 */ "    // Find the minimum element in unsorted array",
  /* 4 */ "    let minIndex = i;",
  /* 5 */ "    for (let j = i + 1; j < n; j++) {",
  /* 6 */ "      // Compare current element with minimum",
  /* 7 */ "      if (arr[j] < arr[minIndex]) {",
  /* 8 */ "        minIndex = j; // Update minIndex",
  /* 9 */ "      }",
  /* 10 */ "    } // End inner loop",
  /* 11 */ "",
  /* 12 */ "    // Swap the found minimum element with the first element",
  /* 13 */ "    // of the unsorted part, if it's not already there",
  /* 14 */ "    if (minIndex !== i) {",
  /* 15 */ "      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];",
  /* 16 */ "    }",
  /* 17 */ "  } // End outer loop",
  /* 18 */ "  return arr;",
  /* 19 */ "}",
];

// --- Selection Sort C Program ---
const C_SELECTION_SORT_CODE = [
  /* 0 */ "void swap(int *xp, int *yp) {",
  /* 1 */ "  int temp = *xp;",
  /* 2 */ "  *xp = *yp;",
  /* 3 */ "  *yp = temp;",
  /* 4 */ "}",
  /* 5 */ "",
  /* 6 */ "void selectionSort(int arr[], int n) {",
  /* 7 */ "  int i, j, min_idx;",
  /* 8 */ "",
  /* 9 */ "  // One by one move boundary of unsorted subarray",
  /* 10 */ "  for (i = 0; i < n-1; i++) {",
  /* 11 */ "    // Find the minimum element in unsorted array",
  /* 12 */ "    min_idx = i;",
  /* 13 */ "    for (j = i+1; j < n; j++) {",
  /* 14 */ "      // Compare current element with minimum",
  /* 15 */ "      if (arr[j] < arr[min_idx])",
  /* 16 */ "        min_idx = j; // Update min_idx",
  /* 17 */ "    }",
  /* 18 */ "",
  /* 19 */ "    // Swap the found minimum element with the first element",
  /* 20 */ "    // if it's not already in place",
  /* 21 */ "    if (min_idx != i)",
  /* 22 */ "      swap(&arr[min_idx], &arr[i]);",
  /* 23 */ "  }",
  /* 24 */ "}",
];


interface AnimationStep {
  array: number[];
  sortedBoundary: number;
  outerLoopIndex_i?: number;
  innerLoopIndex_j?: number;
  minIndex?: number;
  elementsToSwap?: [number, number];
  done?: boolean;
  highlightedPseudoCodeLine?: number | number[];
  highlightedCCodeLine?: number | number[];
}

interface SelectionSortVisualizerProps {
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

interface AlgorithmStateDisplayProps {
  initialArr: number[];
  currentStep: AnimationStep | null;
  style?: CSSProperties;
}

const AlgorithmStateDisplay: React.FC<AlgorithmStateDisplayProps> = ({
  initialArr,
  currentStep,
  style,
}) => {
  const defaultStyle: CSSProperties = {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    padding: '1em',
    borderRadius: '8px',
    fontSize: '0.9em',
    fontFamily: '"Fira Code", "Courier New", monospace',
    lineHeight: '1.7',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #7f8c8d',
    overflowY: 'auto',
  };

  return (
    <div style={{ ...defaultStyle, ...style }}>
      <h4 style={{ marginTop: 0, marginBottom: '0.75em', borderBottom: '1px solid #7f8c8d', paddingBottom: '0.5em' }}>
        Algorithm State
      </h4>
      <p style={{ margin: '0.5em 0' }}>
        <strong>Initial Array:</strong> [{initialArr.join(', ')}]
      </p>
      {currentStep && (
        <>
          <p style={{ margin: '0.5em 0' }}>
            <strong>Current Array:</strong> [
            {currentStep.array.map((val, idx) => {
              let valColor: string | undefined = undefined;
              if (idx === currentStep.minIndex && !(idx < currentStep.sortedBoundary)) valColor = MIN_VAL_COLOR.getHexString();
              if (idx === currentStep.innerLoopIndex_j && !(idx < currentStep.sortedBoundary)) valColor = SCAN_COLOR.getHexString();
              if (currentStep.elementsToSwap?.includes(idx)) valColor = SWAP_COLOR.getHexString();
              if (idx < currentStep.sortedBoundary) valColor = SORTED_COLOR.getHexString();

              return (
                <span key={idx} style={{ color: valColor ? `#${valColor}` : undefined, fontWeight: valColor ? 'bold' : 'normal' }}>
                  {val}{idx < currentStep.array.length - 1 ? ', ' : ''}
                </span>
              );
            })}
            ]
          </p>
          <p style={{ margin: '0.5em 0' }}>
            <strong>Sorted Portion (0 to {currentStep.sortedBoundary > 0 ? currentStep.sortedBoundary - 1 : '-'}):</strong>{' '}
            <span style={{ color: `#${SORTED_COLOR.getHexString()}` }}>
              [{currentStep.array.slice(0, currentStep.sortedBoundary).join(', ') || (currentStep.sortedBoundary === 0 ? "" : " ")}]
            </span>
          </p>
          <p style={{ margin: '0.5em 0' }}>
            <strong>Unsorted Portion ({currentStep.sortedBoundary} to {initialArr.length -1}):</strong>{' '}
            [{currentStep.array.slice(currentStep.sortedBoundary).join(', ') || " "}]
          </p>
          {currentStep.outerLoopIndex_i !== undefined && (
            <p style={{ margin: '0.5em 0' }}>
              <strong>Outer Loop (i):</strong> {currentStep.outerLoopIndex_i}
              <span style={{ fontStyle: 'italic', marginLeft: '5px' }}>(Current boundary for sorted part)</span>
            </p>
          )}
          {currentStep.minIndex !== undefined && (
            <p style={{ margin: '0.5em 0' }}>
              <strong>Min Index in Pass (min_idx):</strong> {currentStep.minIndex}
              <span style={{ color: `#${MIN_VAL_COLOR.getHexString()}`, fontWeight: 'bold' }}>
                {' '}(Value: {currentStep.array[currentStep.minIndex]})
              </span>
            </p>
          )}
          {currentStep.innerLoopIndex_j !== undefined && (
            <p style={{ margin: '0.5em 0' }}>
              <strong>Scanning Index (j):</strong> {currentStep.innerLoopIndex_j}
              <span style={{ color: `#${SCAN_COLOR.getHexString()}`, fontWeight: 'bold' }}>
                {' '}(Value: {currentStep.array[currentStep.innerLoopIndex_j]})
              </span>
            </p>
          )}
           {currentStep.elementsToSwap && (
            <p style={{ margin: '0.5em 0', color: `#${SWAP_COLOR.getHexString()}`, fontWeight: 'bold' }}>
              Swapping: arr[{currentStep.elementsToSwap[0]}] ({currentStep.array[currentStep.elementsToSwap[0]]}) and arr[{currentStep.elementsToSwap[1]}] ({currentStep.array[currentStep.elementsToSwap[1]]})
            </p>
          )}
        </>
      )}
    </div>
  );
};


const SelectionSortVisualizer: React.FC<SelectionSortVisualizerProps> = ({
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
  const [statusMessage, setStatusMessage] = useState<string>("Click Start to visualize Selection Sort");
  const [codeView, setCodeView] = useState<'pseudocode' | 'cProgram'>('pseudocode');

  // Internal state for frame visibility
  const [showAlgorithmState, setShowAlgorithmState] = useState(false);
  const [showCodeDisplay, setShowCodeDisplay] = useState(true);
  // Visualization is always implicitly true for this component's core rendering logic


  const animationSteps = useMemo(() => {
    // ... (Animation steps generation logic - unchanged)
    const arr = [...initialArray];
    const steps: AnimationStep[] = [];
    const n = arr.length;
    let localArr = [...arr];

    steps.push({
      array: [...localArr], sortedBoundary: 0,
      highlightedPseudoCodeLine: [0, 1, 19], 
      highlightedCCodeLine: [6, 7, 9, 24]    
    });

    for (let i = 0; i < n - 1; i++) {
      steps.push({
        array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i,
        highlightedPseudoCodeLine: 2, 
        highlightedCCodeLine: 10      
      });
      let minIndex = i;
      steps.push({
        array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i, minIndex: minIndex,
        highlightedPseudoCodeLine: [3, 4], 
        highlightedCCodeLine: [11, 12]     
      });

      for (let j = i + 1; j < n; j++) {
        steps.push({
          array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i, minIndex: minIndex, innerLoopIndex_j: j,
          highlightedPseudoCodeLine: 5, 
          highlightedCCodeLine: 13      
        });
        steps.push({ 
          array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i,
          minIndex: minIndex, innerLoopIndex_j: j,
          highlightedPseudoCodeLine: [6, 7], 
          highlightedCCodeLine: [14, 15]     
        });
        if (localArr[j] < localArr[minIndex]) {
          minIndex = j;
          steps.push({ 
            array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i,
            minIndex: minIndex, innerLoopIndex_j: j,
            highlightedPseudoCodeLine: 8, 
            highlightedCCodeLine: 16      
          });
        }
      }
      steps.push({
        array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i, minIndex: minIndex,
        highlightedPseudoCodeLine: 10, 
        highlightedCCodeLine: 17       
      });

      steps.push({ 
        array: [...localArr], sortedBoundary: i, outerLoopIndex_i: i, minIndex: minIndex,
        elementsToSwap: minIndex !== i ? [i, minIndex] : undefined,
        highlightedPseudoCodeLine: [12,13,14], 
        highlightedCCodeLine: [19,20,21]       
      });

      if (minIndex !== i) {
        [localArr[i], localArr[minIndex]] = [localArr[minIndex], localArr[i]];
        steps.push({ 
          array: [...localArr], sortedBoundary: i + 1, outerLoopIndex_i: i,
          minIndex: i, 
          elementsToSwap: [i, minIndex],
          highlightedPseudoCodeLine: 15,     
          highlightedCCodeLine: [22, 0,1,2,3,4] 
        });
      } else {
         steps.push({ 
          array: [...localArr], sortedBoundary: i + 1, outerLoopIndex_i: i, minIndex: i,
          highlightedPseudoCodeLine: 16, 
          highlightedCCodeLine: 22 
        });
      }
      steps.push({
        array: [...localArr], sortedBoundary: i + 1,
        highlightedPseudoCodeLine: 17, 
        highlightedCCodeLine: 23       
      });
    }
    steps.push({
      array: [...localArr], sortedBoundary: n, done: true,
      highlightedPseudoCodeLine: [18, 19], 
      highlightedCCodeLine: 24             
    });
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
    if (!mountRef.current || !labelsContainerRef.current) {
        return; 
    }
    
    if (rendererRef.current && mountRef.current && rendererRef.current.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererRef.current = null;
        sceneRef.current = null; 
        cameraRef.current = null;
        meshesRef.current.forEach(mesh => {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
            else mesh.material.dispose();
        });
        meshesRef.current = [];
        labelElementsRef.current.forEach(label => label?.remove());
        labelElementsRef.current = [];
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
    }
    
    const currentMount = mountRef.current;
    const currentLabelsContainer = labelsContainerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const numBars = initialArray.length;
    const totalWidth = numBars * BAR_WIDTH + (numBars - 1) * BAR_SPACING;
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(totalWidth / 2 - (BAR_WIDTH / 2 + BAR_SPACING / 2), MAX_BAR_HEIGHT / 1.5, MAX_BAR_HEIGHT * 1.2);
    camera.lookAt(totalWidth / 2 - (BAR_WIDTH / 2 + BAR_SPACING / 2), MAX_BAR_HEIGHT / 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
    renderer.setClearColor(0x000000, 0); 
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
      if (sceneRef.current) sceneRef.current.add(mesh); 
      
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

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); 
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) { 
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        updateLabelPositions();
      }
    };
    animate();

    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        const width = currentMount.clientWidth; const height = currentMount.clientHeight;
        if (width > 0 && height > 0) { 
            rendererRef.current.setSize(width, height);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            updateLabelPositions();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) { 
        handleResize();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null; 
      
      labelElementsRef.current.forEach(label => label?.remove());
      labelElementsRef.current = [];

      meshesRef.current.forEach(mesh => {
        if (sceneRef.current) sceneRef.current.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      });
      meshesRef.current = [];

      if (rendererRef.current && currentMount && rendererRef.current.domElement.parentNode === currentMount) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null; 
      cameraRef.current = null; 
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
    setStatusMessage(step.done ? "Sorting Complete!" : `Pass ${step.outerLoopIndex_i !== undefined ? step.outerLoopIndex_i + 1 : '...'}, Finding minimum...`);

    if(meshesRef.current.length === step.array.length){ 
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

        if (index === step.minIndex && ! (step.done || index < step.sortedBoundary) ) { 
            targetColor = MIN_VAL_COLOR;
        }
        if (index === step.innerLoopIndex_j && ! (step.done || index < step.sortedBoundary) ) {
            targetColor = SCAN_COLOR;
        }
        if (step.elementsToSwap?.includes(index)) { 
            targetColor = SWAP_COLOR;
        }

        (mesh.material as THREE.MeshStandardMaterial).color.set(targetColor);
        if (labelElementsRef.current[index]) {
            labelElementsRef.current[index]!.textContent = String(value);
        }
        });
        updateLabelPositions();
    }
  }, [currentStepIndex, animationSteps, initialArray]);

  useEffect(() => {
    if (isPlaying && currentStepIndex < animationSteps.length - 1) {
      const timer = setTimeout(() => setCurrentStepIndex(prevIndex => prevIndex + 1), ANIMATION_DELAY_MS);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStepIndex >= animationSteps.length - 1) {
      setIsPlaying(false); setStatusMessage("Sorting Complete!");
    }
  }, [isPlaying, currentStepIndex, animationSteps.length]);

  const handleStart = () => { 
    if (currentStepIndex === -1 || currentStepIndex >= animationSteps.length - 1) {
      setCurrentStepIndex(0); 
    }
    setIsPlaying(true); 
    setStatusMessage("Sorting started..."); 
  };
  const handlePause = () => { setIsPlaying(false); setStatusMessage("Paused."); };
  const handleReset = () => { 
    setIsPlaying(false); 
    setCurrentStepIndex(-1); 
    setStatusMessage("Click Start."); 
  };
  const handleNextStep = () => { 
    if (animationSteps.length === 0) return; 
    if (currentStepIndex === -1) { 
        setCurrentStepIndex(0);
        setIsPlaying(false); 
    } else if (currentStepIndex < animationSteps.length - 1) {
        setIsPlaying(false); 
        setCurrentStepIndex(prev => prev + 1); 
    }
  };
  const handlePrevStep = () => { if (currentStepIndex > 0) { setIsPlaying(false); setCurrentStepIndex(prev => prev - 1); }};

  const currentStepData = animationSteps[currentStepIndex >= 0 ? currentStepIndex : 0]; 
  const highlightedCodeForDisplay = codeView === 'pseudocode'
    ? currentStepData?.highlightedPseudoCodeLine
    : currentStepData?.highlightedCCodeLine;
  
  const checkboxStyle: CSSProperties = {
    marginRight: '0.5rem',
    transform: 'scale(1.1)',
    accentColor: '#3498db', 
  };
  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    color: '#ecf0f1', 
    fontSize: '0.9rem',
    cursor: 'pointer',
  };


  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
      <h2 style={{ textAlign: 'center', color: '#ecf0f1', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Selection Sort Visualization
      </h2>

      {/* Animation Controls and Status */}
      <div style={{
        width: '100%',
        maxWidth: '1000px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem', 
        marginBottom: '1rem',
        padding: '0.75rem',
      }}>
            <div style={{ textAlign: 'center', color: '#bdc3c7', minHeight: '1.5em', fontSize: '0.95rem', width: '100%' }}>
                {statusMessage}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}> 
                <button onClick={handleStart} disabled={isPlaying && currentStepIndex < animationSteps.length -1 && currentStepIndex !== -1} style={buttonStyle}>
                {(currentStepIndex === -1 || currentStepIndex >= animationSteps.length -1) && !isPlaying ? 'Start / Replay' : 'Resume'}
                </button>
                <button onClick={handlePause} disabled={!isPlaying} style={buttonStyle}>Pause</button>
                <button onClick={handlePrevStep} disabled={isPlaying || currentStepIndex <= 0} style={buttonStyle}>Prev Step</button>
                <button onClick={handleNextStep} disabled={isPlaying || currentStepIndex >= animationSteps.length - 1} style={buttonStyle}>Next Step</button>
                <button onClick={handleReset} style={buttonStyle}>Reset</button>
                {showCodeDisplay && ( 
                    <button
                    onClick={() => setCodeView(prev => prev === 'pseudocode' ? 'cProgram' : 'pseudocode')}
                    style={{ ...buttonStyle, backgroundColor: '#2980b9' }}
                    >
                    Show {codeView === 'pseudocode' ? 'C Program' : 'Pseudocode'}
                    </button>
                )}
            </div>
      </div>


      {/* Main Content Area: Visualization, Algorithm State, Code Display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem', width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', width: '100%' }}>
          
          {/* --- Visualization Frame (Always Present) --- */}
          <div style={{ flex: '1 1 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '350px' ,flexGrow: 1}}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', minHeight: '300px', maxHeight: '450px' }}>
                <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
                <div ref={labelsContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
              </div>
          </div>

     
          {/* --- Code Display Frame (Conditionally Rendered) --- */}
          {showCodeDisplay && (
            <div style={{
                flex: '1 1 300px', minWidth: '300px',
                maxHeight: '550px', 
                display: 'flex', flexDirection: 'column', 
              }}>
              <CodeDisplay
                  codeLines={codeView === 'pseudocode' ? SELECTION_SORT_PSEUDO_CODE : C_SELECTION_SORT_CODE}
                  highlightedLines={highlightedCodeForDisplay}
                  style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '100%' }} 
                />
            </div>
          )}

               {/* --- Algorithm State Frame (Conditionally Rendered) --- */}
          {showAlgorithmState && (
            <div style={{ flex: '1 1 300px', minWidth: '100px', maxHeight: '550px', maxWidth:'200px' ,display: 'flex', flexDirection: 'column' }}>
              <AlgorithmStateDisplay
                    initialArr={initialArray}
                    currentStep={currentStepIndex >= 0 ? animationSteps[currentStepIndex] : null}
                    style={{ flexGrow: 1, overflowY: 'auto', height: '100%' }} 
                />
            </div>
          )}



        </div>
      </div>
       
      {/* Visibility Checkboxes - Moved to the bottom */}
      <div style={{ 
          display: 'flex', gap: '1rem', marginTop: '1.5rem', 
          justifyContent: 'center', flexWrap: 'wrap', 
          padding: '0.75rem', // No background for this div
          borderRadius: '8px', width: '100%', maxWidth: '1000px' 
      }}>
            {/* Visualization checkbox is removed */}
            <label style={labelStyle}>
                <input type="checkbox" style={checkboxStyle} checked={showAlgorithmState} onChange={() => setShowAlgorithmState(p => !p)} />
                Algorithm State
            </label>
            <label style={labelStyle}>
                <input type="checkbox" style={checkboxStyle} checked={showCodeDisplay} onChange={() => setShowCodeDisplay(p => !p)} />
                Code
            </label>
      </div>
    </div>
  );
};

const buttonStyle: CSSProperties = {
  padding: '8px 12px', 
  fontSize: '0.85rem', 
  color: 'white', 
  backgroundColor: '#3498db',
  border: 'none', 
  borderRadius: '5px', 
  cursor: 'pointer', 
  transition: 'background-color 0.3s ease',
};

export default SelectionSortVisualizer;
