// components/GsapSortingVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

// Register the Flip plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip);
}

const MAX_VALUE = 125; // Max value for random generation (scaled down for labels)
const MAX_CUSTOM_ARRAY_SIZE = 20; // Limit for custom array to keep UI clean
const DEFAULT_ANIMATION_SPEED_MS = 350; // Animation speed is now fixed to this
const DEFAULT_ARRAY_STRING = "60,25,80,15,170,40,90,10,150,30"; // Default array
const MAX_HISTORY_SIZE = 30; // Limit the number of history states

// --- Helper Functions & Interfaces ---
interface ArrayItem {
  id: string;
  value: number;
}

interface SortProgress {
  i: number;
  j: number;
  swappedInInnerLoop: boolean;
  swappedInOuterLoop: boolean;
  stage:
    | 'idle'
    | 'start_outer_loop'
    | 'start_inner_loop'
    | 'comparing'
    | 'initiating_swap'
    | 'performing_swap'
    | 'finishing_swap'
    | 'end_inner_loop_iteration'
    | 'check_outer_loop_swap'
    | 'end_outer_loop_iteration'
    | 'sorted';
}

interface HistoryEntry {
  array: ArrayItem[];
  sortProgress: SortProgress;
  comparingIndices: [number, number] | null;
  swappingIndices: [number, number] | null;
  sortedIndices: number[];
  currentCodeLine: number | null;
}


const BUBBLE_SORT_PSEUDO_CODE = [
  "function bubbleSort(array) {",              // 0
  "  let n = array.length;",                   // 1
  "  for (let i = 0; i < n - 1; i++) {",     // 2
  "    let swappedInOuterLoop = false;",       // 3
  "    for (let j = 0; j < n - i - 1; j++) {", // 4
  "      // Comparing array[j] and array[j+1]", // 5 (Conceptual line for highlighting)
  "      if (array[j].value > array[j+1].value) {",// 6
  "        // Swapping elements",                // 7 (Conceptual line for highlighting)
  "        swap(array[j], array[j+1]);",        // 8
  "        swappedInOuterLoop = true;",          // 9
  "      }",                                 // 10
  "    }",                                   // 11
  "    if (!swappedInOuterLoop) {",            // 12
  "      break; // Array is sorted",           // 13
  "    }",                                   // 14
  "  }",                                     // 15
  "  // Array is sorted",                   // 16 (Conceptual line for highlighting)
  "}",                                       // 17
];

const BUBBLE_SORT_C_CODE = [
  "void bubbleSort(int arr[], int n) {", // 0
  "  // 'n' is array length (parameter)",  // 1
  "  for (int i = 0; i < n - 1; i++) {", // 2
  "    int swapped = 0; // 0 for false", // 3
  "    for (int j = 0; j < n - i - 1; j++) {", // 4
  "      // Comparing arr[j] and arr[j+1]", // 5
  "      if (arr[j] > arr[j+1]) {", // 6
  "        // Swapping elements",        // 7
  "        int temp = arr[j];",         // 8 (part 1 of swap)
  "        arr[j] = arr[j+1];",         // 8 (part 2 of swap)
  "        arr[j+1] = temp;",          // 8 (part 3 of swap)
  "        swapped = 1; // 1 for true",// 9
  "      }",                             // 10
  "    }",                               // 11
  "    if (swapped == 0) {",             // 12
  "      break; // Array is sorted",       // 13
  "    }",                               // 14
  "  }",                                 // 15
  "  // Array is sorted",               // 16
  "}",                                   // 17
];


// --- Component ---
const GsapSortingVisualizer: React.FC = () => {
  const [array, setArray] = useState<ArrayItem[]>([]); 
  
  const [customArrayInput, setCustomArrayInput] = useState<string>(DEFAULT_ARRAY_STRING); 
  const [inputError, setInputError] = useState<string | null>(null);

  const [sortProgress, setSortProgress] = useState<SortProgress>({
    i: 0, j: 0, swappedInInnerLoop: false, swappedInOuterLoop: false, stage: 'idle',
  });
  const [executionMode, setExecutionMode] = useState<'idle' | 'auto' | 'step' | 'paused'>('idle');
  const [currentCodeLine, setCurrentCodeLine] = useState<number | null>(null);
  const [codeDisplayMode, setCodeDisplayMode] = useState<'pseudocode' | 'c_code'>('pseudocode');
  
  const [comparingIndices, setComparingIndices] = useState<[number, number] | null>(null);
  const [swappingIndices, setSwappingIndices] = useState<[number, number] | null>(null);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);


  const barsContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSortStateAndError = (newArrayToSet: ArrayItem[], clearHistoryStack: boolean = true) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setArray(newArrayToSet);
    setSortProgress({ i: 0, j: 0, swappedInInnerLoop: false, swappedInOuterLoop: false, stage: 'idle' });
    setExecutionMode('idle');
    setCurrentCodeLine(null);
    setComparingIndices(null);
    setSwappingIndices(null);
    setSortedIndices([]);
    setInputError(null); 
    if (clearHistoryStack) {
        setHistory([]);
    }
  };
  
  const handleErrorState = (errorMessage: string) => {
    setInputError(errorMessage);
    setArray([]); 
    setSortProgress({ i: 0, j: 0, swappedInInnerLoop: false, swappedInOuterLoop: false, stage: 'idle' });
    setCurrentCodeLine(null);
    setComparingIndices(null);
    setSwappingIndices(null);
    setSortedIndices([]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setExecutionMode('idle');
    setHistory([]); // Clear history on error
  };


  const applyArrayFromString = useCallback((arrayString: string) => {
    setInputError(null); 
    const stringValues = arrayString.split(',').map(s => s.trim()).filter(s => s !== '');
    const numberValues = stringValues.map(Number);

    if (numberValues.some(isNaN)) {
      handleErrorState('Invalid input: All values must be numbers.');
      return false;
    }
    if (numberValues.length === 0) {
      handleErrorState('Invalid input: Array cannot be empty. Please enter some numbers.');
      return false;
    }
    if (numberValues.length > MAX_CUSTOM_ARRAY_SIZE) {
      handleErrorState(`Invalid input: Maximum array size is ${MAX_CUSTOM_ARRAY_SIZE}.`);
      return false;
    }
    if (numberValues.some(val => val < 1 || val > MAX_VALUE * 1.5)) { 
      handleErrorState(`Invalid input: Values must be between 1 and ${Math.floor(MAX_VALUE * 1.5)}.`);
      return false;
    }
    
    const newArray: ArrayItem[] = numberValues.map((val, i) => ({
      id: `custom-bar-${i}-${Date.now()}`,
      value: val,
    }));
    resetSortStateAndError(newArray, true); // Clear history for a new valid array
    return true;
  }, []);


  const handleApplyCustomArray = () => {
    applyArrayFromString(customArrayInput);
  };
  
  useEffect(() => {
    applyArrayFromString(DEFAULT_ARRAY_STRING);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyArrayFromString]); 

  const runSortStep = useCallback(async () => {
    // Save current state to history before modification for this step
    // Only save if not idle and not already sorted, to avoid duplicate initial/final states in history
    if (sortProgress.stage !== 'idle' && sortProgress.stage !== 'sorted') {
        setHistory(prevHistory => {
            const newEntry = {
                array: [...array.map(item => ({...item}))], // Deep copy array items
                sortProgress: { ...sortProgress },
                comparingIndices,
                swappingIndices,
                sortedIndices: [...sortedIndices],
                currentCodeLine,
            };
            const updatedHistory = [...prevHistory, newEntry];
            if (updatedHistory.length > MAX_HISTORY_SIZE) {
                return updatedHistory.slice(-MAX_HISTORY_SIZE);
            }
            return updatedHistory;
        });
    }


    let currentArr = [...array];
    let progress = { ...sortProgress };
    let newSortedIndices = [...sortedIndices];
    let nextCodeLine: number | null = null;

    const n = currentArr.length;
    if (n === 0) { 
        progress.stage = 'sorted'; 
        setSortProgress(progress);
        setExecutionMode('idle');
        return;
    }

    switch (progress.stage) {
      case 'idle':
        progress.stage = 'start_outer_loop';
        progress.i = 0;
        progress.swappedInOuterLoop = false;
        nextCodeLine = 1; 
        break;
      case 'start_outer_loop':
        setComparingIndices(null); 
        nextCodeLine = 2; 
        if (progress.i < n - 1) {
          progress.stage = 'start_inner_loop';
          progress.j = 0;
          progress.swappedInOuterLoop = false; 
          nextCodeLine = 3; 
        } else {
          progress.stage = 'sorted';
          nextCodeLine = 16; 
        }
        break;
      case 'start_inner_loop':
        setComparingIndices(null); 
        nextCodeLine = 4; 
        if (progress.j < n - progress.i - 1) {
          progress.stage = 'comparing';
          progress.swappedInInnerLoop = false; 
        } else {
          progress.stage = 'check_outer_loop_swap';
        }
        break;
      case 'comparing':
        nextCodeLine = 5; 
        setComparingIndices([progress.j, progress.j + 1]); 
        await new Promise(resolve => setTimeout(resolve, DEFAULT_ANIMATION_SPEED_MS / 2)); 
        nextCodeLine = 6; 
        if (currentArr[progress.j].value > currentArr[progress.j + 1].value) {
          progress.stage = 'initiating_swap'; 
        } else {
          progress.stage = 'end_inner_loop_iteration';
        }
        break;
      case 'initiating_swap':
        nextCodeLine = 7; 
        setComparingIndices(null); 
        setSwappingIndices([progress.j, progress.j + 1]); 
        progress.stage = 'performing_swap';
        break;
      case 'performing_swap':
        nextCodeLine = 8; 
        const bars = barsContainerRef.current?.children;
        if (bars && bars[progress.j] && bars[progress.j+1]) {
            const bar1 = bars[progress.j] as HTMLElement;
            const bar2 = bars[progress.j + 1] as HTMLElement;
            const state = Flip.getState([bar1, bar2], {props: "backgroundColor, height, backgroundImage, borderColor, boxShadow"}); 
            [currentArr[progress.j], currentArr[progress.j + 1]] = [currentArr[progress.j + 1], currentArr[progress.j]];
            setArray([...currentArr]); 
            await new Promise(resolve => setTimeout(resolve, 0)); 
            Flip.from(state, {
                duration: DEFAULT_ANIMATION_SPEED_MS / 1000, 
                ease: 'power2.inOut',
                simple: true, 
            });
            await new Promise(resolve => setTimeout(resolve, DEFAULT_ANIMATION_SPEED_MS)); 
            setSwappingIndices(null); 
        }
        progress.swappedInInnerLoop = true;
        progress.swappedInOuterLoop = true; 
        progress.stage = 'finishing_swap';
        break;
      case 'finishing_swap':
        nextCodeLine = 9; 
        progress.stage = 'end_inner_loop_iteration';
        break;
      case 'end_inner_loop_iteration':
        nextCodeLine = 11; 
        progress.j++;
        progress.stage = 'start_inner_loop'; 
        break;
      case 'check_outer_loop_swap':
        setComparingIndices(null); 
        nextCodeLine = 12; 
        if (n - 1 - progress.i >= 0 && !newSortedIndices.includes(n - 1 - progress.i)) {
             newSortedIndices.push(n - 1 - progress.i);
             setSortedIndices([...newSortedIndices].sort((a,b) => a-b));
        }
        if (!progress.swappedInOuterLoop) {
          for(let k = 0; k < n - progress.i; k++) {
            if (!newSortedIndices.includes(k)) newSortedIndices.push(k);
          }
          setSortedIndices([...newSortedIndices].sort((a,b) => a-b));
          progress.stage = 'sorted';
          nextCodeLine = 13; 
        } else {
          progress.stage = 'end_outer_loop_iteration';
        }
        break;
      case 'end_outer_loop_iteration':
        setComparingIndices(null); 
        nextCodeLine = 14; 
        progress.i++;
        progress.stage = 'start_outer_loop'; 
        break;
      case 'sorted':
        setComparingIndices(null);
        setSwappingIndices(null);
        nextCodeLine = 16; 
        const allIndices = Array.from({length: n}, (_, k) => k);
        setSortedIndices(allIndices); 
        setExecutionMode('idle');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        break;
    }
    setSortProgress(progress);
    if (nextCodeLine !== null) setCurrentCodeLine(nextCodeLine);
    if (executionMode === 'auto' && progress.stage !== 'sorted') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(runSortStep, DEFAULT_ANIMATION_SPEED_MS * 1.1); 
    }
  }, [array, sortProgress, executionMode, sortedIndices, comparingIndices, swappingIndices, currentCodeLine]); // Added history dependencies

  const handleStartSort = () => {
    if (array.length === 0) {
        setInputError("Cannot sort: Array is empty. Please input numbers and click 'Apply'.");
        return;
    }
    if (sortProgress.stage === 'sorted') { 
        resetSortStateAndError([...array], true); 
    }
    setHistory([]); // Clear history when starting a new sort
    setExecutionMode('auto');
    if (sortProgress.stage === 'idle' || sortProgress.stage === 'sorted') {
      setSortProgress({ i: 0, j: 0, swappedInInnerLoop: false, swappedInOuterLoop: false, stage: 'start_outer_loop' });
      setSortedIndices([]); 
      setCurrentCodeLine(0); 
    }
  };

  const handlePauseSort = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setExecutionMode('paused');
  };
  const handleResumeSort = () => { setExecutionMode('auto'); };
  
  const handleNextStep = () => {
    if (array.length === 0) {
        setInputError("Cannot step: Array is empty. Please input numbers and click 'Apply'.");
        return;
    }
    if (sortProgress.stage === 'sorted' && executionMode !== 'idle') return; // Prevent next step if already sorted and not idle

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setExecutionMode('step'); 
    
    if (sortProgress.stage === 'idle' || sortProgress.stage === 'sorted') {
        // If starting from idle or sorted, reset progress for a new sort run
        setSortProgress({ i: 0, j: 0, swappedInInnerLoop: false, swappedInOuterLoop: false, stage: 'start_outer_loop' });
        setSortedIndices([]);
        setCurrentCodeLine(0);
        setHistory([]); // Clear history for a fresh start
        // Call runSortStep after a brief delay to allow state to update
        setTimeout(() => runSortStep(), 0); 
    } else {
        runSortStep(); 
    }
  };

  const handlePreviousStep = () => {
    if (history.length === 0) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const prevState = history[history.length - 1];
    setArray(prevState.array.map(item => ({...item})));
    setSortProgress(prevState.sortProgress);
    setComparingIndices(prevState.comparingIndices);
    setSwappingIndices(prevState.swappingIndices);
    setSortedIndices([...prevState.sortedIndices]);
    setCurrentCodeLine(prevState.currentCodeLine);
    
    setHistory(prev => prev.slice(0, -1));
    setExecutionMode('paused'); // Go to paused state to allow further stepping or auto play
  };

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCustomArrayInput(DEFAULT_ARRAY_STRING);
    applyArrayFromString(DEFAULT_ARRAY_STRING); // This calls resetSortStateAndError and clears history
    setExecutionMode('idle');
  };
  
  useEffect(() => {
    if (executionMode === 'auto' && sortProgress.stage !== 'sorted' && sortProgress.stage !== 'idle') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current); 
      timeoutRef.current = setTimeout(runSortStep, DEFAULT_ANIMATION_SPEED_MS * 1.1); 
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [executionMode, sortProgress, runSortStep]); 

  const getBarStyles = (index: number): { className: string; style: React.CSSProperties } => {
    let baseClasses = 'flex-1 relative flex flex-col justify-end items-center text-white font-medium transition-all duration-150 shadow-lg '; 
    let style: React.CSSProperties = {
      minWidth: '10px', 
      borderTopLeftRadius: '4px', 
      borderTopRightRadius: '4px',
      position: 'relative', 
      borderWidth: '1px 1px 2px 1px', 
      borderStyle: 'solid',
    };
    let gradient = '';
    let topBorderColor = 'rgba(255, 255, 255, 0.3)'; 
    let sideBorderColor = 'rgba(0, 0, 0, 0.15)';   
    let bottomBorderColor = 'rgba(0, 0, 0, 0.3)';  

    if (swappingIndices && (swappingIndices[0] === index || swappingIndices[1] === index)) {
      gradient = 'bg-gradient-to-b from-orange-300 to-orange-600'; 
      topBorderColor = 'rgba(253, 230, 138, 0.5)'; 
      sideBorderColor = 'rgba(194, 65, 12, 0.4)';
      bottomBorderColor = 'rgba(194, 65, 12, 0.6)'; 
    } else if (comparingIndices && (comparingIndices[0] === index || comparingIndices[1] === index)) {
      gradient = 'bg-gradient-to-b from-yellow-200 to-yellow-500'; 
      topBorderColor = 'rgba(254, 249, 195, 0.5)'; 
      sideBorderColor = 'rgba(180, 83, 9, 0.4)';
      bottomBorderColor = 'rgba(180, 83, 9, 0.6)'; 
    } else if (sortedIndices.includes(index)) {
      gradient = 'bg-gradient-to-b from-green-300 to-green-600';
      topBorderColor = 'rgba(134, 239, 172, 0.5)'; 
      sideBorderColor = 'rgba(22, 107, 52, 0.4)';
      bottomBorderColor = 'rgba(22, 107, 52, 0.6)'; 
    } else {
      gradient = 'bg-gradient-to-b from-sky-300 to-sky-600';
      topBorderColor = 'rgba(125, 211, 252, 0.5)'; 
      sideBorderColor = 'rgba(2, 82, 128, 0.4)';
      bottomBorderColor = 'rgba(2, 82, 128, 0.6)'; 
    }
    
    style.borderTopColor = topBorderColor;
    style.borderLeftColor = sideBorderColor;
    style.borderRightColor = sideBorderColor;
    style.borderBottomColor = bottomBorderColor;

    return { className: `${baseClasses} ${gradient}`, style };
  };

  const codeToDisplay = codeDisplayMode === 'pseudocode' ? BUBBLE_SORT_PSEUDO_CODE : BUBBLE_SORT_C_CODE;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 p-4 text-white pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">GSAP Sorting Visualizer</h1>
      <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-6">
        <div className="flex-grow lg:w-2/3 flex flex-col gap-4">
          <div className="p-3 bg-gray-800 rounded-lg shadow-md">
            {/* Updated grid for new buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 mb-3"> 
              <button onClick={handleStartSort} disabled={executionMode === 'auto' || array.length === 0} className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Start Auto</button>
              <button onClick={handlePauseSort} disabled={executionMode !== 'auto'} className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Pause</button>
              <button onClick={handleResumeSort} disabled={executionMode !== 'paused'} className="px-3 py-2 text-sm bg-sky-500 hover:bg-sky-600 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Resume</button>
              <button onClick={handlePreviousStep} disabled={history.length === 0 || executionMode === 'auto'} className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Prev Step</button>
              <button onClick={handleNextStep} disabled={executionMode === 'auto' || (sortProgress.stage === 'sorted' && executionMode !== 'idle') || array.length === 0} className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Next Step</button>
              <button onClick={handleReset} disabled={executionMode === 'auto'} className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow">Reset</button>
            </div>
          </div>
          
          <div className="p-3 bg-gray-800 rounded-lg shadow-md">
            <label htmlFor="customArrayInput" className="block text-sm font-medium mb-1">Enter Array (comma-separated, max {MAX_CUSTOM_ARRAY_SIZE} items):</label>
            <div className="flex gap-2">
              <input
                type="text" id="customArrayInput" value={customArrayInput}
                onChange={(e) => setCustomArrayInput(e.target.value)}
                placeholder="e.g., 50,20,80,10,60"
                disabled={executionMode === 'auto' || executionMode === 'paused'}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-sm disabled:opacity-50"
              />
              <button 
                onClick={handleApplyCustomArray}
                disabled={executionMode === 'auto' || executionMode === 'paused'}
                className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 rounded disabled:opacity-50 shadow-sm hover:shadow-lg transition-shadow"
              >Apply</button>
            </div>
            {inputError && <p className="text-red-400 text-xs mt-1">{inputError}</p>}
            {array.length === 0 && !inputError && <p className="text-gray-400 text-xs mt-1">Default array applied. You can change it and click 'Apply'.</p>}
          </div>

          <div
            ref={barsContainerRef}
            className="flex items-end justify-center space-x-1 h-[280px] w-full p-2 rounded-lg relative border border-gray-600" 
            style={{ minHeight: `${MAX_VALUE + 60}px` }} 
          >
            {array.map((item, index) => {
              const { className: barClassName, style: barStyle } = getBarStyles(index);
              return (
                <div
                  key={item.id} data-id={item.id} className={barClassName}
                  style={{ ...barStyle, height: `${item.value * (MAX_VALUE / 100)}px`}}
                  title={`Value: ${item.value}`}
                >
                  {array.length <= 15 && (
                    <span 
                      className="absolute -top-5 text-xs text-gray-200 font-medium"
                      style={{ opacity: item.value > 0 ? 1 : 0, transform: 'translateX(-50%)', left: '50%', textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}
                    >{item.value}</span>
                  )}
                </div>);
            })}
          </div>
          {/* Bar Legend moved here */}
          <div className="p-3 bg-gray-800 rounded-lg shadow-md mt-4">
            <h4 className="text-md font-semibold mb-1 text-center">Bar Legend:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-xs justify-items-center">
              <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-xs bg-gradient-to-b from-sky-400 to-sky-600 border-t border-sky-200/50 border-x border-sky-700/40 border-b-2 border-sky-800/60"></div><span>Default</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-xs bg-gradient-to-b from-yellow-200 to-yellow-500 border-t border-yellow-100/50 border-x border-yellow-600/40 border-b-2 border-yellow-700/60"></div><span>Comparing</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-xs bg-gradient-to-b from-orange-300 to-orange-600 border-t border-orange-200/50 border-x border-orange-700/40 border-b-2 border-orange-800/60"></div><span>Swapping</span></div> 
              <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-xs bg-gradient-to-b from-green-300 to-green-600 border-t border-green-200/50 border-x border-green-700/40 border-b-2 border-green-800/60"></div><span>Sorted</span></div>
            </div>
          </div>
          <div className="mt-1 text-xs text-center">
            {executionMode === 'auto' && sortProgress.stage !== 'sorted' && <p className="text-yellow-300">Auto sorting...</p>}
            {executionMode === 'paused' && <p className="text-blue-300">Paused. Click Resume or Next Step.</p>}
            {sortProgress.stage === 'sorted' && array.length > 0 && <p className="text-green-300 font-semibold">Array is sorted!</p>}
          </div>
        </div>

        <div className="lg:w-1/3 p-4 bg-gray-800 rounded-lg shadow-md h-fit sticky top-6">
          <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-2">
            <h3 className="text-lg font-semibold">Algorithm Code</h3>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCodeDisplayMode('pseudocode')}
                className={`px-2 py-1 text-xs rounded ${codeDisplayMode === 'pseudocode' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >Pseudo</button>
              <button 
                onClick={() => setCodeDisplayMode('c_code')}
                className={`px-2 py-1 text-xs rounded ${codeDisplayMode === 'c_code' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >C Code</button>
            </div>
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-[300px] lg:max-h-full text-left">
            {codeToDisplay.map((line, index) => (
              <div
                key={index}
                className={`p-0.5 rounded ${currentCodeLine === index ? 'bg-yellow-400 text-black font-semibold' : 'text-gray-300'}`}
              >
                <span className="mr-1 select-none text-gray-500">{String(index).padStart(2, '0')}:</span>
                {line}
              </div>
            ))}
          </pre>
          {/* Legend removed from here */}
        </div>
      </div>
    
    </div>
  );
};

export default GsapSortingVisualizer;
