'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// --- Constants for Colors ---
const DEFAULT_COLOR = 0x60a5fa; // Tailwind blue-400
const POINTER_LOW_HIGH_COLOR = 0xfb923c; // Tailwind orange-400 (for low/high markers if distinct) - currently unused
const MID_COLOR = 0x4ade80; // Tailwind green-400
const TARGET_FOUND_COLOR = 0xf87171; // Tailwind red-400
const DISCARDED_COLOR = 0x9ca3af; // Tailwind gray-400
const PROCESSING_COLOR = 0xc084fc; // Tailwind purple-400 (current search space)

const ANIMATION_DELAY_MS = 700; // Animation delay for auto-play

// --- Visualization Constants ---
const BAR_WIDTH = 0.8;
const BAR_DEPTH = 0.8; 
const BAR_SPACING = 0.3;
const MAX_BAR_HEIGHT = 7; 
const MIN_BAR_HEIGHT = 0.2;

// --- Pseudocode and C Code ---
const pseudocode = [
  "function binarySearch(array, target):", // 0
  "  low = 0",                            // 1
  "  high = array.length - 1",            // 2
  "",                                     // 3 (empty)
  "  while low <= high:",                 // 4
  "    mid = floor((low + high) / 2)",    // 5
  "    guess = array[mid]",               // 6
  "",                                     // 7 (empty)
  "    if guess == target:",              // 8
  "      return mid  // Found",           // 9
  "    else if guess < target:",          // 10
  "      low = mid + 1 // Search right",  // 11
  "    else:",                            // 12
  "      high = mid - 1 // Search left",  // 13
  "  return -1 // Not found",             // 14
];

const cCode = [
  "int binarySearch(int arr[], int n, int target) {", // 0
  "  int low = 0;",                                  // 1
  "  int high = n - 1;",                             // 2
  "",                                                // 3 (empty)
  "  while (low <= high) {",                         // 4
  "    int mid = low + (high - low) / 2;",           // 5
  "    int guess = arr[mid];",                        // 6
  "",                                                // 7 (empty)
  "    if (guess == target) {",                      // 8
  "      return mid; // Found",                       // 9
  "    }",                                           // 10
  "    if (guess < target) {",                       // 11
  "      low = mid + 1; // Search right",             // 12
  "    } else {",                                    // 13
  "      high = mid - 1; // Search left",            // 14
  "    }",                                           // 15
  "  }",                                             // 16
  "  return -1; // Not found",                       // 17
  "}",                                               // 18
];

// --- Helper: Enhanced Code Display Component ---
type CodeDisplayProps = {
  title: string;
  codeLines: string[];
  activeLine: number | number[] | null | undefined;
  language: string;
};

const CodeDisplay: React.FC<CodeDisplayProps> = ({ title, codeLines, activeLine, language }) => {
  const isLineHighlighted = (lineNumber: number) => {
    if (activeLine === null || activeLine === undefined) return false;
    if (typeof activeLine === 'number') return activeLine === lineNumber;
    return activeLine.includes(lineNumber);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-2">{title} ({language})</h3>
      <pre className="text-sm leading-relaxed overflow-auto flex-grow bg-gray-900 p-3 rounded-md custom-scrollbar">
        {codeLines.map((line, index) => (
          <div
            key={index}
            className={`flex items-start transition-colors duration-200 ${
              isLineHighlighted(index) ? 'bg-sky-700' : 'hover:bg-gray-700/50'
            }`}
          >
            <span
              className={`inline-block w-10 text-right pr-3 select-none flex-shrink-0 ${
                isLineHighlighted(index) ? 'text-sky-300' : 'text-gray-500'
              }`}
            >
              {index + 1}
            </span>
            <code
              className={`whitespace-pre-wrap flex-grow ${
                isLineHighlighted(index) ? 'text-white font-medium' : 'text-gray-300'
              }`}
            >
              {line || '\u00A0'} {/* Render non-breaking space for empty lines */}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
};

// --- Step Type Definition ---
type Step = {
  low: number;
  high: number;
  mid: number;
  guess: number | null;
  message: string;
  activePseudoLine: number | number[] | null | undefined;
  activeCLine: number | number[] | null | undefined;
  barStates: number[]; // Array of color hex values
  found?: boolean;
};

export default function BinarySearchPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]); 

  const [arrayInput, setArrayInput] = useState('10, 22, 35, 40, 51, 68, 70, 83, 90, 100');
  const [targetInput, setTargetInput] = useState('70');
  const [parsedArray, setParsedArray] = useState<number[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [statusMessage, setStatusMessage] = useState('Enter a sorted array and target, then click "Start Search".');
  const [activePseudoLine, setActivePseudoLine] = useState<number | number[] | null>(null);
  const [activeCLine, setActiveCLine] = useState<number | number[] | null>(null);
  
  const [isSearching, setIsSearching] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(false); 
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [codeView, setCodeView] = useState<'pseudocode' | 'cProgram'>('pseudocode'); 

  // --- Three.js Initialization ---
  useEffect(() => {
    if (!mountRef.current) return;
    let animationFrameId: number;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x1f2937); 

    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    cameraRef.current = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    cameraRef.current.position.set(0, MAX_BAR_HEIGHT / 1.5, MAX_BAR_HEIGHT * 1.5); 
    cameraRef.current.lookAt(0, MAX_BAR_HEIGHT / 3, 0);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(rendererRef.current.domElement);

    labelRendererRef.current = new CSS2DRenderer();
    labelRendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    labelRendererRef.current.domElement.style.position = 'absolute';
    labelRendererRef.current.domElement.style.top = '0px';
    labelRendererRef.current.domElement.style.pointerEvents = 'none'; 
    mountRef.current.appendChild(labelRendererRef.current.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(MAX_BAR_HEIGHT * 0.5, MAX_BAR_HEIGHT * 1.5, MAX_BAR_HEIGHT);
    sceneRef.current.add(directionalLight);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      if (labelRendererRef.current && sceneRef.current && cameraRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current && labelRendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        rendererRef.current.setSize(width, height);
        labelRendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (mountRef.current && labelRendererRef.current?.domElement) {
         mountRef.current.removeChild(labelRendererRef.current.domElement);
      }
      barsRef.current.forEach(bar => {
        if (bar.geometry) bar.geometry.dispose();
        if (bar.material) {
            if (Array.isArray(bar.material)) bar.material.forEach(m => m.dispose());
            else bar.material.dispose();
        }
        bar.children.forEach(child => { 
            if (child instanceof CSS2DObject) child.element.remove();
        });
        if (sceneRef.current) sceneRef.current.remove(bar);
      });
      barsRef.current = [];
      rendererRef.current?.dispose();
      labelRendererRef.current = null; 
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  // --- Create/Update Bars ---
  const createBars = useCallback((arr: number[]) => {
    if (!sceneRef.current || !cameraRef.current) return;

    barsRef.current.forEach(bar => {
        bar.children.forEach(child => { if (child instanceof CSS2DObject) child.element.remove(); });
        if (sceneRef.current) sceneRef.current.remove(bar); // Ensure removal from scene
        if (bar.geometry) bar.geometry.dispose();
        if (bar.material) {
            if(Array.isArray(bar.material)) bar.material.forEach(m => m.dispose());
            else bar.material.dispose();
        }
    });
    barsRef.current = [];

    if (arr.length === 0) { 
        cameraRef.current.position.set(0, MAX_BAR_HEIGHT / 1.5, MAX_BAR_HEIGHT * 1.5);
        cameraRef.current.lookAt(0, MAX_BAR_HEIGHT / 3, 0);
        cameraRef.current.updateProjectionMatrix();
        return;
    }

    const maxValue = Math.max(...arr.map(val => Math.abs(val)), 1); 
    const totalVisualWidth = arr.length * BAR_WIDTH + (arr.length > 0 ? (arr.length - 1) * BAR_SPACING : 0);
    const startX = -totalVisualWidth / 2 + BAR_WIDTH / 2;

    arr.forEach((value, index) => {
      const barHeight = Math.max(MIN_BAR_HEIGHT, (Math.abs(value) / maxValue) * MAX_BAR_HEIGHT);
      const geometry = new THREE.BoxGeometry(BAR_WIDTH, barHeight, BAR_DEPTH);
      const material = new THREE.MeshStandardMaterial({ color: DEFAULT_COLOR, transparent: true, opacity: 0.9 });
      const bar = new THREE.Mesh(geometry, material);
      
      bar.position.x = startX + index * (BAR_WIDTH + BAR_SPACING);
      bar.position.y = barHeight / 2; 
      if (sceneRef.current) sceneRef.current.add(bar);
      barsRef.current.push(bar);

      const labelDiv = document.createElement('div');
      labelDiv.className = 'text-white text-xs sm:text-sm bg-black bg-opacity-60 px-1.5 py-0.5 rounded-md shadow-md';
      labelDiv.textContent = value.toString();
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, barHeight / 2 + 0.3, 0); 
      bar.add(label);
    });

    const cameraX = totalVisualWidth / 2 - BAR_WIDTH / 2 - (BAR_SPACING/2 * (arr.length > 1 ? 1: 0) ) ; 
    const cameraY = MAX_BAR_HEIGHT * 0.6; 
    const cameraZ = Math.max(MAX_BAR_HEIGHT * 1.2, totalVisualWidth * 0.8 + MAX_BAR_HEIGHT * 0.5); 

    cameraRef.current.position.set(cameraX, cameraY, cameraZ);
    cameraRef.current.lookAt(cameraX, MAX_BAR_HEIGHT / 3, 0); 
    cameraRef.current.updateProjectionMatrix();
    
  }, []);


  // --- Binary Search Algorithm Steps Generation ---
  const generateBinarySearchSteps = (arr: number[], val: number): Step[] => {
    const localSteps: Step[] = [];
    let low = 0;
    let high = arr.length - 1;
    let iteration = 0;

    localSteps.push({
      low, high, mid: -1, guess: null,
      message: `Searching for ${val}. Array range: [${arr[low] ?? 'N/A'}-${arr[high] ?? 'N/A'}].`,
      activePseudoLine: [1,2], activeCLine: [1,2],
      barStates: arr.map((_, i) => (i >= low && i <= high) ? PROCESSING_COLOR : DISCARDED_COLOR)
    });

    while (low <= high) {
      iteration++;
      if (iteration > arr.length + 10) { 
        localSteps.push({ message: "Search terminated (max iterations).", low, high, mid: -1, guess: null, activePseudoLine: -1, activeCLine: -1, barStates: arr.map(() => DISCARDED_COLOR) });
        break;
      }

      localSteps.push({
        low, high, mid: -1, guess: null,
        message: `Loop ${iteration}: low=${low} (val: ${arr[low] ?? 'N/A'}), high=${high} (val: ${arr[high] ?? 'N/A'}). Condition low <= high is ${low <= high}.`,
        activePseudoLine: 4, activeCLine: 4,
        barStates: arr.map((_, i) => (i < low || i > high) ? DISCARDED_COLOR : PROCESSING_COLOR)
      });

      if (!(low <= high)) break; 

      let mid = Math.floor((low + high) / 2);
      let guess = arr[mid];

      localSteps.push({
        low, high, mid, guess,
        message: `Calculated mid index = ${mid}. Value at arr[${mid}] is ${guess}.`,
        activePseudoLine: [5,6], activeCLine: [5,6],
        barStates: arr.map((_, i) => {
          if (i < low || i > high) return DISCARDED_COLOR;
          if (i === mid) return MID_COLOR;
          return PROCESSING_COLOR;
        })
      });

      localSteps.push({
        low, high, mid, guess,
        message: `Comparing guess (${guess}) with target (${val}).`,
        activePseudoLine: 8, activeCLine: 8,
        barStates: arr.map((_, i) => (i === mid ? MID_COLOR : (i >= low && i <= high ? PROCESSING_COLOR : DISCARDED_COLOR)))
      });

      if (guess === val) {
        localSteps.push({
          low, high, mid, guess,
          message: `Target ${val} FOUND at index ${mid}!`,
          activePseudoLine: 9, activeCLine: 9,
          found: true,
          barStates: arr.map((_, i) => (i === mid ? TARGET_FOUND_COLOR : DISCARDED_COLOR))
        });
        return localSteps;
      } else if (guess < val) {
        localSteps.push({
          low, high, mid, guess,
          message: `Guess (${guess}) < Target (${val}). Update low = mid + 1.`,
          activePseudoLine: [10,11], activeCLine: [11,12],
          barStates: arr.map((_, i) => (i === mid ? MID_COLOR : (i >= low && i <= high ? PROCESSING_COLOR : DISCARDED_COLOR)))
        });
        low = mid + 1;
      } else { 
         localSteps.push({
          low, high, mid, guess,
          message: `Guess (${guess}) > Target (${val}). Update high = mid - 1.`,
          activePseudoLine: [12,13], activeCLine: [13,14],
          barStates: arr.map((_, i) => (i === mid ? MID_COLOR : (i >= low && i <= high ? PROCESSING_COLOR : DISCARDED_COLOR)))
        });
        high = mid - 1;
      }
        if (low <= high && arr[low] !== undefined && arr[high] !== undefined) { 
            localSteps.push({
                low, high, mid: -1, guess: null, 
                message: `New search range: low=${low} (val: ${arr[low]}), high=${high} (val: ${arr[high]}).`,
                activePseudoLine: 4, 
                activeCLine: 4,      
                barStates: arr.map((_, i) => (i >= low && i <= high) ? PROCESSING_COLOR : DISCARDED_COLOR)
            });
        } else if (low <= high) { 
             localSteps.push({
                low, high, mid: -1, guess: null,
                message: `New search range: low=${low}, high=${high}.`,
                activePseudoLine: 4, activeCLine: 4,
                barStates: arr.map((_, i) => (i >= low && i <= high) ? PROCESSING_COLOR : DISCARDED_COLOR)
            });
        }
    }

    if (low > high) { 
        localSteps.push({
          low, high, mid: -1, guess: null,
          message: `Target ${val} NOT FOUND. (low=${low}, high=${high})`,
          activePseudoLine: 14, activeCLine: 17,
          found: false,
          barStates: arr.map(() => DISCARDED_COLOR)
        });
    }
    return localSteps;
  };

  // --- Update Visualization ---
  const updateVisualization = useCallback((step: Step) => {
    if (!step || !barsRef.current.length) return;

    setStatusMessage(step.message);
    setActivePseudoLine(step.activePseudoLine ?? null);
    setActiveCLine(step.activeCLine ?? null);

    barsRef.current.forEach((bar, index) => {
      if (step.barStates && step.barStates[index] !== undefined) { 
        (bar.material as THREE.MeshStandardMaterial).color.setHex(step.barStates[index]);
        (bar.material as THREE.MeshStandardMaterial).opacity = (step.barStates[index] === DISCARDED_COLOR) ? 0.35 : 0.9;
      } else { 
        (bar.material as THREE.MeshStandardMaterial).color.setHex(DEFAULT_COLOR);
        (bar.material as THREE.MeshStandardMaterial).opacity = 0.9;
      }
    });
  }, []); 

  // --- Event Handlers ---
  const handleStartSearch = () => {
    setIsPlaying(false); 
    const rawArray = arrayInput.split(',').map(s => s.trim());
    let tempParsedArray: number[];
    try {
      tempParsedArray = rawArray.map(s => {
        const num = parseInt(s, 10);
        if (isNaN(num)) throw new Error("Invalid number in array.");
        return num;
      });
    } catch (error) {
      setStatusMessage("Error: Array contains non-numeric values."); return;
    }
    
    for (let i = 0; i < tempParsedArray.length - 1; i++) {
      if (tempParsedArray[i] > tempParsedArray[i+1]) {
        setStatusMessage("Error: Array must be sorted for Binary Search."); return;
      }
    }
    if (tempParsedArray.length === 0) {
        setStatusMessage("Error: Array cannot be empty.");
        setParsedArray([]);
        createBars([]); 
        return;
    }

    setParsedArray(tempParsedArray);
    const val = parseInt(targetInput, 10);
    if (isNaN(val)) {
      setStatusMessage("Error: Target value is not a valid number."); return;
    }
    setTarget(val);

    createBars(tempParsedArray); 
    const searchSteps = generateBinarySearchSteps(tempParsedArray, val);
    setSteps(searchSteps);
    setCurrentStepIndex(0);
    setIsSearching(true);
    setSearchCompleted(false);
    if (searchSteps.length > 0) updateVisualization(searchSteps[0]);
    else setStatusMessage("No steps generated. Array might be empty or issue with input.");
  };

  const processStepChange = (newStepIndex: number) => {
    setCurrentStepIndex(newStepIndex);
    updateVisualization(steps[newStepIndex]);
    if (steps[newStepIndex]?.found !== undefined || newStepIndex === steps.length -1) {
      setSearchCompleted(true);
      setIsPlaying(false); 
    } else {
      setSearchCompleted(false);
    }
  };
  
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      processStepChange(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      processStepChange(currentStepIndex - 1);
    }
  };
  
  const handlePlayPause = () => {
    if (!parsedArray || parsedArray.length === 0) {
        setStatusMessage("Please start a search with a valid array first.");
        return;
    }
    if (searchCompleted && currentStepIndex >= steps.length -1) { 
        handleStartSearch(); 
        return;
    }
    setIsPlaying(!isPlaying);
    if (!isSearching && steps.length > 0) { 
        setIsSearching(true);
    }
    if (!isPlaying && !searchCompleted) { 
      // Message will be updated by the step itself
    } else if (isPlaying && !searchCompleted) { 
        const currentMessage = steps[currentStepIndex]?.message || statusMessage;
        setStatusMessage(currentMessage + " (Paused)");
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsSearching(false);
    setSearchCompleted(false);
    setArrayInput('10, 22, 35, 40, 51, 68, 70, 83, 90, 100');
    setTargetInput('70');
    setParsedArray([]);
    setTarget(null);
    setSteps([]);
    setCurrentStepIndex(-1);
    setStatusMessage('Enter a sorted array and target, then click "Start Search".');
    setActivePseudoLine(null);
    setActiveCLine(null);
    createBars([]); 
  };

  // Effect for Auto-Play
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isPlaying && !searchCompleted && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        handleNextStep();
      }, ANIMATION_DELAY_MS);
    } else if (isPlaying && (searchCompleted || currentStepIndex >= steps.length - 1)) {
      setIsPlaying(false); 
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, searchCompleted, handleNextStep]); // Added handleNextStep to dependencies


  // Initial bar creation effect
  useEffect(() => {
    if (parsedArray.length > 0 && !isSearching) { 
        createBars(parsedArray); 
        const initialLow = 0;
        const initialHigh = parsedArray.length - 1;
        barsRef.current.forEach((bar, index) => { 
            (bar.material as THREE.MeshStandardMaterial).color.setHex((index >= initialLow && index <= initialHigh) ? PROCESSING_COLOR : DEFAULT_COLOR);
            (bar.material as THREE.MeshStandardMaterial).opacity = 0.9;
        });
    } else if (parsedArray.length === 0 && !isSearching) {
        createBars([]); 
    }
  }, [parsedArray, isSearching, createBars]); // Added createBars to dependencies


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">Binary Search Visualization</h1>
      </header>

      <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl mb-6 flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-grow w-full md:w-auto">
          <label htmlFor="arrayInput" className="block text-sm font-medium text-gray-300 mb-1">
            Sorted Array (comma-separated):
          </label>
          <input
            type="text" id="arrayInput" value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            placeholder="e.g., 1, 5, 10, 15, 20"
            className="w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            disabled={isSearching && !searchCompleted && isPlaying}
          />
        </div>
        <div className="flex-grow w-full md:w-auto">
          <label htmlFor="targetInput" className="block text-sm font-medium text-gray-300 mb-1">
            Target Value:
          </label>
          <input
            type="text" id="targetInput" value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="e.g., 10"
            className="w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            disabled={isSearching && !searchCompleted && isPlaying}
          />
        </div>
        <div className="flex items-end mt-2 md:mt-0">
          <button
            onClick={handleStartSearch}
            disabled={isSearching && !searchCompleted && isPlaying}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-md shadow-md disabled:opacity-60 transition-all duration-150 text-white font-medium"
          >
            Start Search
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-[60vh]">
        <div className="lg:w-7/12 w-full flex flex-col gap-4"> 
            <div className="flex-grow bg-gray-800 rounded-xl shadow-2xl p-1 min-h-[250px] sm:min-h-[300px] md:min-h-[350px]"> 
                <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden"></div>
            </div>
            {statusMessage && (
                <div className="p-3 bg-gray-700 rounded-md text-center text-sm shadow">
                {statusMessage}
                </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-2 bg-gray-800 rounded-xl shadow-lg">
                <button onClick={handlePlayPause} disabled={(!isSearching && !searchCompleted && steps.length === 0) || (parsedArray.length === 0)} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md shadow disabled:opacity-50 transition-colors">
                {isPlaying ? 'Pause' : (searchCompleted && currentStepIndex >= steps.length -1 ? 'Replay' : 'Play')}
                </button>
                <button onClick={handlePrevStep} disabled={isPlaying || !isSearching || currentStepIndex <= 0} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-md shadow disabled:opacity-50 transition-colors">Prev Step</button>
                <button onClick={handleNextStep} disabled={isPlaying || !isSearching || searchCompleted || currentStepIndex >= steps.length -1} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-md shadow disabled:opacity-50 transition-colors">Next Step</button>
                <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md shadow transition-colors">Reset</button>
            </div>
        </div>

        <div className="lg:w-5/12 w-full flex flex-col gap-4 min-h-[400px] lg:min-h-0"> 
          <div className="flex justify-center">
            <button 
              onClick={() => setCodeView(cv => cv === 'pseudocode' ? 'cProgram' : 'pseudocode')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md shadow transition-colors"
            >
              Show {codeView === 'pseudocode' ? 'C Program' : 'Pseudocode'}
            </button>
          </div>
          {codeView === 'pseudocode' ? (
            <CodeDisplay title="Pseudocode" codeLines={pseudocode} activeLine={activePseudoLine} language="Algorithm" />
          ) : (
            <CodeDisplay title="C Program" codeLines={cCode} activeLine={activeCLine} language="C" />
          )}
        </div>
      </div>

      <footer className="text-center mt-8 py-4 border-t border-gray-700">
        <p className="text-sm text-gray-500">Enhanced Binary Search Visualization</p>
      </footer>
    </div>
  );
}
