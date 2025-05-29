// src/components/MergeSortVisualizer.tsx
'use client';

import React, { useRef, useEffect, useState, useMemo, CSSProperties } from 'react';
import * as THREE from 'three';

// --- Configuration ---
const BAR_WIDTH = 0.8;
const BAR_SPACING = 0.2;
const MAX_BAR_HEIGHT = 5;

const DEFAULT_COLOR = new THREE.Color(0xbdc3c7); // Light Gray for unsorted
const RECURSION_COLOR = new THREE.Color(0x3498db); // Blue for active recursive call range
const MERGE_LEFT_COLOR = new THREE.Color(0x9b59b6); // Purple for left subarray in merge
const MERGE_RIGHT_COLOR = new THREE.Color(0x1abc9c); // Turquoise for right subarray in merge
const COMPARE_COLOR = new THREE.Color(0xf39c12);   // Orange for elements being compared
const PLACE_COLOR = new THREE.Color(0xf1c40f);     // Yellow for element being placed
const SORTED_COLOR = new THREE.Color(0x2ecc71);    // Green for sorted parts

const ANIMATION_DELAY_MS = 700; // Adjusted for Merge Sort's steps

// --- Merge Sort Pseudocode ---
const MERGE_SORT_CODE = [
  /* 0 */ "function mergeSort(arr, left, right) {",
  /* 1 */ "  if (left >= right) { // Base case",
  /* 2 */ "    return;",
  /* 3 */ "  }",
  /* 4 */ "  let mid = Math.floor((left + right) / 2);",
  /* 5 */ "",
  /* 6 */ "  mergeSort(arr, left, mid);      // Sort left half",
  /* 7 */ "  mergeSort(arr, mid + 1, right); // Sort right half",
  /* 8 */ "",
  /* 9 */ "  merge(arr, left, mid, right); // Merge sorted halves",
  /* 10 */ "}",
  /* 11 */ "",
  /* 12 */ "function merge(arr, l, m, r) {",
  /* 13 */ "  // Create temp arrays L and R",
  /* 14 */ "  // Copy data to L (from arr[l..m]) and R (from arr[m+1..r])",
  /* 15 */ "  let i = 0, j = 0, k = l; // Pointers for L, R, and arr",
  /* 16 */ "",
  /* 17 */ "  while (i < L.length && j < R.length) {",
  /* 18 */ "    if (L[i] <= R[j]) {",
  /* 19 */ "      arr[k] = L[i]; i++;",
  /* 20 */ "    } else {",
  /* 21 */ "      arr[k] = R[j]; j++;",
  /* 22 */ "    }",
  /* 23 */ "    k++;",
  /* 24 */ "  }",
  /* 25 */ "",
  /* 26 */ "  // Copy remaining elements of L, if any",
  /* 27 */ "  while (i < L.length) { arr[k] = L[i]; i++; k++; }",
  /* 28 */ "",
  /* 29 */ "  // Copy remaining elements of R, if any",
  /* 30 */ "  while (j < R.length) { arr[k] = R[j]; j++; k++; }",
  /* 31 */ "}",
];


interface AnimationStep {
  array: number[];
  activeRecursiveRange?: [number, number]; // [l, r] of current mergeSort call
  isMergePhase?: boolean;                 // True if currently in merge operation for activeRecursiveRange
  isRecursiveCall?: boolean;              // True if currently in a recursive call phase
  leftMergeRange?: [number, number];      // [l, m] original indices
  rightMergeRange?: [number, number];     // [m+1, r] original indices
  compareInL?: { value: number, originalIndex: number }; // Value and original index from left part
  compareInR?: { value: number, originalIndex: number }; // Value and original index from right part
  writeIndex?: number;                    // k, where value is being written in original array
  writtenValue?: number;                  // Value being written
  isCopyingRemaining?: 'L' | 'R';
  copyRemainingOriginalIndex?: number;    // Original index of element being copied from L or R
  sortedRanges: [number, number][];       // Ranges confirmed to be sorted
  highlightedCodeLine?: number | number[];
  statusMessage?: string;
  done?: boolean;
}


interface MergeSortVisualizerProps {
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

const MergeSortVisualizer: React.FC<MergeSortVisualizerProps> = ({
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
  const [statusMessage, setStatusMessage] = useState<string>("Click Start to visualize Merge Sort");

  const animationSteps = useMemo(() => {
    const steps: AnimationStep[] = [];
    let arrForSorting = [...initialArray]; // Use a mutable copy for the sorting process

    steps.push({
      array: [...arrForSorting],
      sortedRanges: [],
      highlightedCodeLine: [0, 10, 12, 31],
      statusMessage: "Initial array. Merge Sort begins.",
    });

    function merge(l: number, m: number, r: number, currentSortedRanges: [number, number][]) {
      const n1 = m - l + 1;
      const n2 = r - m;
      const L = new Array(n1);
      const R = new Array(n2);

      steps.push({
        array: [...arrForSorting],
        isMergePhase: true,
        activeRecursiveRange: [l,r], // The range this merge will sort
        leftMergeRange: [l, m],
        rightMergeRange: [m + 1, r],
        sortedRanges: [...currentSortedRanges],
        highlightedCodeLine: [13, 14],
        statusMessage: `Merging arr[${l}..${m}] and arr[${m + 1}..${r}]. Creating temp arrays L & R.`,
      });

      for (let i = 0; i < n1; i++) L[i] = arrForSorting[l + i];
      for (let j = 0; j < n2; j++) R[j] = arrForSorting[m + 1 + j];

      let i = 0, j = 0, k = l;
      steps.push({
        array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
        leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
        sortedRanges: [...currentSortedRanges], highlightedCodeLine: 15,
        statusMessage: `Pointers: L[${i}]=${L[i] ?? 'end'}, R[${j}]=${R[j] ?? 'end'}, writing to arr[${k}]`,
      });

      while (i < n1 && j < n2) {
        steps.push({
          array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
          leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
          compareInL: { value: L[i], originalIndex: l + i },
          compareInR: { value: R[j], originalIndex: m + 1 + j },
          writeIndex: k,
          sortedRanges: [...currentSortedRanges], highlightedCodeLine: [17, 18],
          statusMessage: `Comparing L[${i}] (${L[i]}) and R[${j}] (${R[j]})`,
        });
        if (L[i] <= R[j]) {
          arrForSorting[k] = L[i];
          steps.push({
            array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
            leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
            compareInL: { value: L[i], originalIndex: l + i }, // Keep showing comparison for context
            compareInR: { value: R[j], originalIndex: m + 1 + j },
            writeIndex: k, writtenValue: L[i],
            sortedRanges: [...currentSortedRanges], highlightedCodeLine: 19,
            statusMessage: `Placed ${L[i]} from Left into arr[${k}]`,
          });
          i++;
        } else {
          arrForSorting[k] = R[j];
          steps.push({
            array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
            leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
            compareInL: { value: L[i], originalIndex: l + i },
            compareInR: { value: R[j], originalIndex: m + 1 + j },
            writeIndex: k, writtenValue: R[j],
            sortedRanges: [...currentSortedRanges], highlightedCodeLine: 21,
            statusMessage: `Placed ${R[j]} from Right into arr[${k}]`,
          });
          j++;
        }
        k++;
        if (i < n1 || j < n2) { // If there are more elements to process in this merge
             steps.push({
                array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
                leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
                writeIndex: k-1, // Show last written index
                sortedRanges: [...currentSortedRanges], highlightedCodeLine: 23,
                statusMessage: `Incremented k to ${k}. Next L[${i}]=${L[i] ?? 'end'}, R[${j}]=${R[j] ?? 'end'}`,
            });
        }
      }

      while (i < n1) {
        steps.push({
          array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
          leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
          isCopyingRemaining: 'L', copyRemainingOriginalIndex: l + i,
          writeIndex: k, writtenValue: L[i],
          sortedRanges: [...currentSortedRanges], highlightedCodeLine: [26, 27],
          statusMessage: `Copying remaining ${L[i]} from Left to arr[${k}]`,
        });
        arrForSorting[k] = L[i];
        i++;
        k++;
      }
      while (j < n2) {
        steps.push({
          array: [...arrForSorting], isMergePhase: true, activeRecursiveRange: [l,r],
          leftMergeRange: [l, m], rightMergeRange: [m + 1, r],
          isCopyingRemaining: 'R', copyRemainingOriginalIndex: m + 1 + j,
          writeIndex: k, writtenValue: R[j],
          sortedRanges: [...currentSortedRanges], highlightedCodeLine: [29, 30],
          statusMessage: `Copying remaining ${R[j]} from Right to arr[${k}]`,
        });
        arrForSorting[k] = R[j];
        j++;
        k++;
      }
      // After merge, this range [l,r] is sorted. Update sortedRanges.
      let updatedSortedRanges = [...currentSortedRanges];
      let newRange: [number, number] = [l, r];
      // Simple merge of sorted ranges - can be optimized
      updatedSortedRanges = updatedSortedRanges.filter(range => range[0] > r || range[1] < l); // Remove fully contained or disjoint old ranges
      updatedSortedRanges.push(newRange);
      updatedSortedRanges.sort((a, b) => a[0] - b[0]);
      // Consolidate overlapping/adjacent ranges
      if (updatedSortedRanges.length > 0) {
        const consolidated = [updatedSortedRanges[0]];
        for (let idx = 1; idx < updatedSortedRanges.length; idx++) {
          const last = consolidated[consolidated.length - 1];
          const current = updatedSortedRanges[idx];
          if (current[0] <= last[1] + 1) { // Overlap or adjacent
            last[1] = Math.max(last[1], current[1]);
          } else {
            consolidated.push(current);
          }
        }
        updatedSortedRanges = consolidated;
      }


      steps.push({
        array: [...arrForSorting],
        activeRecursiveRange: [l,r],
        sortedRanges: updatedSortedRanges,
        highlightedCodeLine: 31, // End of merge function
        statusMessage: `Segment arr[${l}..${r}] is now sorted.`,
      });
    }

    function mergeSortRecursive(l: number, r: number, parentSortedRanges: [number, number][]) {
      steps.push({
        array: [...arrForSorting],
        activeRecursiveRange: [l, r],
        isRecursiveCall: true,
        sortedRanges: [...parentSortedRanges],
        highlightedCodeLine: 0,
        statusMessage: `mergeSort(arr, ${l}, ${r})`,
      });

      if (l >= r) {
        steps.push({
          array: [...arrForSorting],
          activeRecursiveRange: [l, r],
          isRecursiveCall: true, // Still part of a call, just base case
          sortedRanges: mergeSortedRanges([...parentSortedRanges], (l <= r ? [[l,r]] : [])), // A single element range is sorted
          highlightedCodeLine: [1, 2],
          statusMessage: `Base case: l=${l}, r=${r}. Segment is sorted.`,
        });
        return;
      }

      const m = l + Math.floor((r - l) / 2);
      steps.push({
        array: [...arrForSorting],
        activeRecursiveRange: [l, r],
        isRecursiveCall: true,
        sortedRanges: [...parentSortedRanges],
        highlightedCodeLine: 4,
        statusMessage: `Calculated mid = ${m} for range [${l}..${r}]`,
      });

      steps.push({ array: [...arrForSorting], activeRecursiveRange: [l,m], isRecursiveCall: true, sortedRanges: [...parentSortedRanges], highlightedCodeLine: 6, statusMessage: `Recursive call: mergeSort(arr, ${l}, ${m})` });
      mergeSortRecursive(l, m, parentSortedRanges);
      const sortedRangesAfterLeft = steps[steps.length - 1].sortedRanges;


      steps.push({ array: [...arrForSorting], activeRecursiveRange: [m+1,r], isRecursiveCall: true, sortedRanges: [...sortedRangesAfterLeft], highlightedCodeLine: 7, statusMessage: `Recursive call: mergeSort(arr, ${m+1}, ${r})` });
      mergeSortRecursive(m + 1, r, sortedRangesAfterLeft);
      const sortedRangesAfterRight = steps[steps.length - 1].sortedRanges;

      steps.push({ array: [...arrForSorting], activeRecursiveRange: [l,r], isMergePhase: true, leftMergeRange: [l,m], rightMergeRange: [m+1,r], sortedRanges: [...sortedRangesAfterRight], highlightedCodeLine: 9, statusMessage: `Prepare to merge arr[${l}..${m}] and arr[${m+1}..${r}]` });
      merge(l, m, r, sortedRangesAfterRight);
    }
    
    // Helper to merge sorted ranges (simplified for now)
    function mergeSortedRanges(existing: [number, number][], newRanges: [number, number][]): [number, number][] {
        let combined = [...existing, ...newRanges];
        if (combined.length === 0) return [];
        combined.sort((a, b) => a[0] - b[0]);
        const consolidated = [combined[0]];
        for (let i = 1; i < combined.length; i++) {
            const last = consolidated[consolidated.length - 1];
            const current = combined[i];
            if (current[0] <= last[1] + 1) {
                last[1] = Math.max(last[1], current[1]);
            } else {
                consolidated.push(current);
            }
        }
        return consolidated;
    }


    mergeSortRecursive(0, arrForSorting.length - 1, []);

    steps.push({
      array: [...arrForSorting],
      sortedRanges: arrForSorting.length > 0 ? [[0, arrForSorting.length - 1]] : [],
      done: true,
      highlightedCodeLine: [10, 31], // End of functions
      statusMessage: "Array is completely sorted!",
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
    const maxValue = Math.max(...step.array, 1); // Use current step's array for max value
    setStatusMessage(step.statusMessage || (step.done ? "Sorting Complete!" : "Processing..."));

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

      // Check if index is within any sorted range
      let isSorted = false;
      for (const range of step.sortedRanges) {
        if (index >= range[0] && index <= range[1]) {
          isSorted = true;
          break;
        }
      }
      if (isSorted || step.done) {
        targetColor = SORTED_COLOR;
      }

      if (step.isMergePhase) {
        if (step.leftMergeRange && index >= step.leftMergeRange[0] && index <= step.leftMergeRange[1] && !isSorted) {
          targetColor = MERGE_LEFT_COLOR;
        }
        if (step.rightMergeRange && index >= step.rightMergeRange[0] && index <= step.rightMergeRange[1] && !isSorted) {
          targetColor = MERGE_RIGHT_COLOR;
        }
        if (step.compareInL?.originalIndex === index || step.compareInR?.originalIndex === index) {
          targetColor = COMPARE_COLOR;
        }
        if (step.writeIndex === index) {
          targetColor = PLACE_COLOR;
        }
        if (step.isCopyingRemaining && step.copyRemainingOriginalIndex === index) {
            targetColor = PLACE_COLOR; // Highlight element being copied from L/R
        }

      } else if (step.isRecursiveCall && step.activeRecursiveRange && !isSorted) {
        if (index >= step.activeRecursiveRange[0] && index <= step.activeRecursiveRange[1]) {
          targetColor = RECURSION_COLOR;
        }
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
        Merge Sort Visualization
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
              codeLines={MERGE_SORT_CODE}
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

export default MergeSortVisualizer;
