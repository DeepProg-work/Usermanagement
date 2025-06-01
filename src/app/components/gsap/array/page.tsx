// components/ArrayOperationsVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';



const MAX_ARRAY_SIZE = 12;
const ANIMATION_DURATION = 0.5; // seconds
const STEP_DELAY_MS = 400; // Delay between automatic steps, slightly increased
const ELEMENT_WIDTH_PX = 60; 
const ELEMENT_HEIGHT_PX = 60;

interface ArrayElement {
  id: string;
  value: string | number;
}

type Operation = 
  | 'idle' 
  | 'append'
  | 'insert_at'
  | 'delete_at'; // <-- add this

interface ModalProps {
  isOpen: boolean;
  operation: Operation | null;
  onClose: () => void; 
  onSubmit: (details: { value?: string; index?: string }) => void;
  currentArrayLength: number;
}

// --- C Language Code Definitions ---
const C_CODE_MAP: Record<Operation | 'idle', string[]> = { 
  idle: ["// Select an operation to see the C code."],
  append: [ // 0-12
    "void append(int arr[], int *size, int capacity, int value) {", // 0
    "  // 1. Validate: Check if array has space",                  // 1
    "  if (*size >= capacity) {",                                 // 2
    "    // Array is full, cannot append.",                       // 3
    "    // (Visualizer shows error message)",                    // 4
    "    return;",                                                // 5
    "  }",                                                        // 6
    "  // 2. Perform: Add value at the current end",              // 7
    "  arr[*size] = value; // Element visually appears now",      // 8
    "  // 3. Update size",                                        // 9
    "  (*size)++;",                                               // 10
    "  // 4. Animation completes & function ends",                // 11
    "}",                                                          // 12
  ],
  insert_at: [ // 0-13
    "void insertAtIndex(int arr[], int *size, int capacity, int index, int value) {", // 0
    "  // 1. Validate inputs",                                                      // 1
    "  if (*size >= capacity) { /* Array full */ return; }",                       // 2
    "  if (index < 0 || index > *size) { /* Invalid index */ return; }",            // 3
    "  // 2. Shift elements to the right to make space",                            // 4
    "  for (int i = *size - 1; i >= index; i--) {",                               // 5
    "    arr[i+1] = arr[i]; // Conceptual copy, visual shift occurs",              // 6
    "  }",                                                                        // 7
    "  // 3. Insert the new element",                                               // 8
    "  arr[index] = value;",                                                      // 9
    "  // 4. Update size",                                                        // 10
    "  (*size)++;",                                                               // 11
    "  // 5. Animate new element & finalize",                                     // 12
    "}",                                                                          // 13
  ],
  delete_at: [
    "void deleteAtIndex(int arr[], int *size, int index) {",
    "  // 1. Validate inputs",
    "  if (*size == 0) { /* Array empty */ return; }",
    "  if (index < 0 || index >= *size) { /* Invalid index */ return; }",
    "  // 2. Shift elements left to fill the gap",
    "  for (int i = index; i < *size - 1; i++) {",
    "    arr[i] = arr[i+1]; // Visual shift left",
    "  }",
    "  // 3. Update size",
    "  (*size)--;",
    "  // 4. Animation completes & function ends",
    "}",
  ],
};

// --- Python Code Definitions ---
const PYTHON_CODE_MAP: Record<Operation | 'idle', string[]> = {
  idle: ["# Select an operation to see the Python code."],
  append: [ // 0-8
    "def append_to_list(my_list, value, capacity):",          // 0
    "  # 1. Validate: Check if list has space",               // 1
    "  if len(my_list) >= capacity:",                         // 2
    "    # List is full (conceptually for fixed-size viz)",   // 3
    "    return False # Indicate failure",                    // 4
    "  # 2. Perform: Add value to the end (element appears)", // 5
    "  my_list.append(value)",                                // 6
    "  # 3. Animation completes & function returns",          // 7
    "  return True",                                          // 8
  ],
  insert_at: [ // 0-8
    "def insert_at_index(my_list, index, value, capacity):",  // 0
    "  # 1. Validate inputs",                                 // 1
    "  if len(my_list) >= capacity: return False # Full",   // 2
    "  if not (0 <= index <= len(my_list)): return False # Invalid index", // 3
    "  # 2. Perform: Python's list.insert handles shifts",    // 4
    "  my_list.insert(index, value)",                         // 5
    "  # (Visualizer: Animate shifts before this step)",      // 6
    "  # 3. Animate: (Visualizer specific step for new item)",// 7
    "  return True",                                          // 8
  ],
  delete_at: [
    "def delete_at_index(my_list, index):",
    "  # 1. Validate inputs",
    "  if len(my_list) == 0: return False # Empty",
    "  if not (0 <= index < len(my_list)): return False # Invalid index",
    "  # 2. Perform: Remove at index (visual shift left)",
    "  my_list.pop(index)",
    "  # 3. Animation completes & function returns",
    "  return True",
  ],
};


const OperationModal: React.FC<ModalProps> = ({ isOpen, operation, onClose, onSubmit, currentArrayLength }) => {
  const [modalValue, setModalValue] = useState('');
  const [modalIndex, setModalIndex] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModalValue('');
      setModalIndex('');
      setModalError('');
    }
  }, [isOpen]);

  if (!isOpen || !operation) return null;

  const needsValue = ['append', 'insert_at'].includes(operation);
  const needsIndex = ['insert_at', 'delete_at'].includes(operation); // <-- update here

  const handleSubmit = () => {
    setModalError('');
    if (needsValue && !modalValue.trim()) {
      setModalError('Value cannot be empty.');
      return;
    }
    if (needsIndex) {
      const idx = parseInt(modalIndex.trim(), 10);
      if (isNaN(idx)) {
        setModalError('Index must be a number.');
        return;
      }
      if (operation === 'insert_at' && (idx < 0 || idx > currentArrayLength)) {
         setModalError(`Index for insert must be between 0 and ${currentArrayLength}.`);
         return;
      }
    }
    onSubmit({ value: modalValue, index: modalIndex }); 
  };
  
  const getOperationName = (op: Operation) => {
    if (op === 'append') return 'Append Value';
    if (op === 'insert_at') return 'Insert Value at Index';
    if (op === 'delete_at') return 'Delete Value at Index'; // <-- add this
    return 'Operation';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-sky-400">{getOperationName(operation)}</h2>
        {modalError && <p className="text-red-400 text-sm mb-3">{modalError}</p>}
        {needsValue && (
          <div className="mb-4">
            <label htmlFor="modalValue" className="block text-sm font-medium text-gray-300 mb-1">Value:</label>
            <input
              type="text" id="modalValue" value={modalValue} onChange={(e) => setModalValue(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-sky-500" autoFocus={!needsIndex}
            />
          </div>
        )}
        {needsIndex && (
          <div className="mb-4">
            <label htmlFor="modalIndex" className="block text-sm font-medium text-gray-300 mb-1">Index:</label>
            <input
              type="text" id="modalIndex" value={modalIndex} onChange={(e) => setModalIndex(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-sky-500" autoFocus
            />
          </div>
        )}
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 rounded text-white">Submit</button>
        </div>
      </div>
    </div>
  );
};


const ArrayOperationsVisualizer: React.FC = () => {
  const [array, setArray] = useState<ArrayElement[]>([]);
  const [message, setMessage] = useState<string>('Choose an operation.');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [hideIndex,setHideIndex] = useState<boolean>(false); // <-- add this
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperationForModal, setCurrentOperationForModal] = useState<Operation | null>(null);
  const [activeOperationType, setActiveOperationType] = useState<Operation | null>(null);
  
  const [codeLanguageMode, setCodeLanguageMode] = useState<'c' | 'python'>('c'); 
  const [currentOperationCode, setCurrentOperationCode] = useState<string[]>(C_CODE_MAP.idle); 
  const [currentCodeLineHighlights, setCurrentCodeLineHighlights] = useState<number[]>([]);
  const [programStateView, setProgramStateView] = useState<Record<string, string | number | null | undefined>>({});


  const [operationSteps, setOperationSteps] = useState<Array<() => Promise<void> | void>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOperationActive, setIsOperationActive] = useState(false); 
  const [isStepExecuting, setIsStepExecuting] = useState(false); 
  const [executionMode, setExecutionMode] = useState<'idle' | 'step' | 'auto' | 'paused'>('idle');

  const elementsContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map()); 
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  useEffect(() => {
    const initialData = [
      { id: generateId(), value: 10 }, { id: generateId(), value: 20 },
      { id: generateId(), value: 30 }, { id: generateId(), value: 40 },
    ];
    setArray(initialData);
    setMessage('Default array loaded. Choose an operation.');
    setProgramStateView({ note: "Select an operation to see its state." });

    setTimeout(() => {
        initialData.forEach((item, index) => {
            const el = elementsRef.current.get(item.id);
            if (el) {
                gsap.set(el, { opacity: 0, scale: 0.3, y: 30 }); 
                gsap.to(el, {
                    opacity: 1, scale: 1, y: 0, duration: ANIMATION_DURATION * 1.5, 
                    delay: index * 0.1, ease: 'elastic.out(1, 0.75)',
                });
            }
        });
    }, 100);
  }, []); 

  const animateElementIn = (elementId: string, fromX?: number, delay: number = 0) => { 
    const el = elementsRef.current.get(elementId);
    if (el) {
      gsap.set(el, { opacity: 0, scale: 0.5, x: fromX ?? 0, y: fromX ? 0 : -20 }); 
      gsap.to(el, { 
        opacity: 1, scale: 1, x: 0, y: 0,
        duration: ANIMATION_DURATION, delay, ease: 'back.out(1.7)' 
      });
    }
  };
  
  const animateBlockShift = async (startIndex: number, distance: number, direction: 'left' | 'right') => { 
    const elementsToShift: HTMLElement[] = [];
    const arrayStateForThisShift = [...array]; 

    for (let i = startIndex; i < arrayStateForThisShift.length; i++) {
        const item = arrayStateForThisShift[i];
        if (item) { 
            const el = elementsRef.current.get(item.id);
            if (el) elementsToShift.push(el);
        }
    }

    if (elementsToShift.length > 0) {
        await gsap.to(elementsToShift, {
            x: (idx) => (direction === 'right' ? `+=${distance + 8}` : `-=${distance + 8}`), 
            duration: ANIMATION_DURATION / 1.5, 
            ease: 'power2.inOut',
            stagger: 0.03,
        }).then();
        // This function will now expect the caller to reset transforms if needed,
        // especially before a React state update that changes DOM order.
        // gsap.set(elementsToShift, { x: 0 }); 
    }
  };
  
  useEffect(() => {
    const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
    const opKey = activeOperationType || 'idle';
    setCurrentOperationCode(mapToUse[opKey as Operation | 'idle'] || mapToUse.idle);
  }, [codeLanguageMode, activeOperationType]);

  const finishOperation = useCallback((statusMessage?: string) => {
    setIsOperationActive(false);
    setIsStepExecuting(false);
    if (statusMessage) {
        setMessage(statusMessage);
    } else {
        setMessage(prev => prev.includes("...") ? prev.replace("...", " completed.") : `${activeOperationType || 'Operation'} finished.`);
    }
    setProgramStateView(prev => ({ ...prev, status: statusMessage || "Completed" }));
  }, [activeOperationType]);


  const prepareOperation = useCallback(async (op: Operation, details: { value?: string; index?: string }) => {
    if (isOperationActive && executionMode === 'auto') { 
        setMessage("Operation in auto mode. Please pause or wait.");
        return; 
    }
  
    setIsStepExecuting(false); 
    setHighlightedIndex(null);
    
    const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
    setCurrentOperationCode(mapToUse[op] || mapToUse.idle);
    setCurrentCodeLineHighlights([0]); 
    setMessage(`Preparing to ${op}...`);
    
    const currentArrayLengthAtPrep = array.length; 
    const arraySnapshotAtPrep = [...array.map(item => ({...item}))]; 

    const initialProgramState: Record<string, any> = { 
        operation: op, 
        language: codeLanguageMode, 
        status: "Preparing...",
        current_size_at_start: currentArrayLengthAtPrep, 
        capacity: MAX_ARRAY_SIZE,
    };
     if (op === 'append' || op === 'insert_at') {
        initialProgramState.value_to_add = details.value?.trim() || '';
        initialProgramState.status = "Validating...";
    }
    if (op === 'insert_at') { 
        initialProgramState.index_to_insert_at = parseInt(details.index?.trim() || '-1', 10);
    }
    setProgramStateView(initialProgramState);


    const val = details.value?.trim() || ''; 
    const idxString = details.index?.trim() || '';
    const idx = parseInt(idxString, 10); 
    let tempNewItemId: string | null = null; 

    let steps: Array<() => Promise<void> | void> = [];

    if (op === 'append') {
        // ... (Append logic as before) ...
        steps.push(async () => { 
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 1, 2] : [0,1,2]); 
          setMessage(`Validating for append...`);
          setProgramStateView(prev => ({ ...prev, status: "Checking capacity..."}));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          if (currentArrayLengthAtPrep >= MAX_ARRAY_SIZE) { 
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 1, 2, 3, 4, 5] : [0,1,2,3,4]); 
            const errorMsg = `Array is full (max ${MAX_ARRAY_SIZE} items). Cannot append.`;
            setProgramStateView(prev => ({ ...prev, status: "Error: Array Full"}));
            return Promise.reject(errorMsg);
          }
          if (!val) {
            const errorMsg = "Value cannot be empty for append.";
            setProgramStateView(prev => ({ ...prev, status: "Error: Value Empty"}));
            return Promise.reject(errorMsg);
          }
          setProgramStateView(prev => ({ ...prev, status: "Validation OK"}));
        });

        steps.push(async () => { 
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 7, 8] : [0,5,6]); 
          setMessage(`Logically appending ${val} and animating...`);
          setProgramStateView(prev => ({ ...prev, status: `Assigning arr[${currentArrayLengthAtPrep}] = ${val} & Animating`}));
          
          const newAppendItem: ArrayElement = { id: generateId(), value: val };
          tempNewItemId = newAppendItem.id;
          
          setArray(prevArr => [...prevArr, newAppendItem]); 
          
          await new Promise(resolve => setTimeout(() => { 
              if (tempNewItemId) animateElementIn(tempNewItemId!, ELEMENT_WIDTH_PX + 8);
              resolve(true);
          }, 50)); 
        });
        
        steps.push(async () => { 
            const newSize = currentArrayLengthAtPrep + 1; 

            if (codeLanguageMode === 'c') {
                setCurrentCodeLineHighlights([0, 9, 10]);
                setMessage(`Updating array size (C logic)...`);
                setProgramStateView(prev => ({ 
                    ...prev, 
                    status: "Incrementing size...", 
                    current_size: newSize 
                }));
            } else { 
                setCurrentCodeLineHighlights([0,7,8]); 
                setMessage(`Animation finished (Python)...`);
                setProgramStateView(prev => ({ 
                    ...prev, 
                    status: "Animation finished.", 
                    current_size: newSize 
                }));
            }
            await new Promise(r => setTimeout(r, ANIMATION_DURATION * 1000 + 50)); 
        });

        if (codeLanguageMode === 'c') { 
            steps.push(async () => { 
              setCurrentCodeLineHighlights([0, 11, 12]); 
              setMessage(`Append operation complete.`);
              setProgramStateView(prev => ({ ...prev, status: "Function end."}));
              await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2)); 
            });
        }
    } else if (op === 'insert_at') {
        steps.push(async () => { // Step 1: Validate
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 1, 2, 3] : [0,1,2,3]);
            setMessage(`Validating for insert at index ${idx}...`);
            setProgramStateView(prev => ({...prev, status: "Validating inputs..."}));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            if (currentArrayLengthAtPrep >= MAX_ARRAY_SIZE) {
                const errorMsg = `Array is full (max ${MAX_ARRAY_SIZE} items).`;
                setProgramStateView(prev => ({...prev, status: "Error: Array Full"}));
                return Promise.reject(errorMsg);
            }
            if (!val) {
                const errorMsg = "Value cannot be empty for insert.";
                setProgramStateView(prev => ({...prev, status: "Error: Value Empty"}));
                return Promise.reject(errorMsg);
            }
            if (isNaN(idx) || idx < 0 || idx > currentArrayLengthAtPrep) { 
                const errorMsg = `Invalid index. Must be between 0 and ${currentArrayLengthAtPrep}.`;
                setProgramStateView(prev => ({...prev, status: "Error: Invalid Index"}));
                return Promise.reject(errorMsg);
            }
            setProgramStateView(prev => ({...prev, status: "Validation OK"}));
        });

        if (idx < currentArrayLengthAtPrep) { 
            if (codeLanguageMode === 'c') {
                steps.push(async () => { 
                    setCurrentCodeLineHighlights([0, 4, 5]); 
                    setMessage(`C: Starting to shift elements from right to make space at index ${idx}...`);
                    setProgramStateView(prev => ({ 
                        ...prev, 
                        status: `Preparing C shift loop (i from ${currentArrayLengthAtPrep - 1} down to ${idx})`,
                        c_loop_iterator_i: currentArrayLengthAtPrep - 1 
                    }));
                    await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
                });

                for (let i_loop = currentArrayLengthAtPrep - 1; i_loop >= idx; i_loop--) {
                    const elementToShiftId = arraySnapshotAtPrep[i_loop].id; 
                    const originalElementValue = arraySnapshotAtPrep[i_loop].value;
                    
                    steps.push(async () => { 
                        setCurrentCodeLineHighlights([0, 5, 6, 7]); 
                        setMessage(`C Loop: Shifting element from index ${i_loop} (value: ${originalElementValue}) to ${i_loop + 1}...`);
                        setProgramStateView(prev => ({
                            ...prev,
                            status: `Loop: i = ${i_loop}. Shifting arr[${i_loop}] to arr[${i_loop + 1}]`,
                            c_loop_iterator_i: i_loop,
                            value_being_shifted: originalElementValue,
                        }));
                        
                        const el = elementsRef.current.get(elementToShiftId);
                        if (el) {
                            await gsap.to(el, {
                                x: `+=${ELEMENT_WIDTH_PX + 8}`, 
                                duration: ANIMATION_DURATION / 1.2, 
                                ease: 'power2.inOut',
                            }).then();
                        }
                        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2)); 
                    });
                }
            } else if (codeLanguageMode === 'python' && idx < currentArrayLengthAtPrep) {
                 steps.push(async () => { 
                    setCurrentCodeLineHighlights([0, 4, 6]); 
                    setMessage(`Visually shifting elements for Python's list.insert...`);
                    setProgramStateView(prev => ({ ...prev, status: "Visual block shift for Python..." }));
                    await animateBlockShift(idx, ELEMENT_WIDTH_PX + 8, 'right');
                    // After animateBlockShift, reset transforms before logical insertion
                    for (let i_reset = idx; i_reset < currentArrayLengthAtPrep; i_reset++) {
                        const idToReset = arraySnapshotAtPrep[i_reset].id;
                        const el = elementsRef.current.get(idToReset);
                        if(el) gsap.set(el, {x: 0});
                    }
                 });
            }
        }
        
        steps.push(() => { // Step 3: Perform Logical Insertion (Reset transforms if C code)
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 8, 9] : [0,4,5]);
            setMessage(`Inserting ${val} at index ${idx}...`);
            setProgramStateView(prev => ({...prev, status: `Inserting ${val} at arr[${idx}]`}));
            
            // Reset x transforms of ALL elements that were visually shifted in C code path
            if (codeLanguageMode === 'c' && idx < currentArrayLengthAtPrep) {
                for (let i_reset = idx; i_reset < currentArrayLengthAtPrep; i_reset++) { 
                     const shiftedElementId = arraySnapshotAtPrep[i_reset].id; 
                     const el = elementsRef.current.get(shiftedElementId);
                     if (el) {
                        gsap.set(el, { x: 0 }); 
                     }
                }
            }

            const newInsertItem: ArrayElement = { id: generateId(), value: val };
            tempNewItemId = newInsertItem.id;
            setArray(prevArr => {
                const newArr = [...prevArr];
                newArr.splice(idx, 0, newInsertItem);
                return newArr;
            });
        });
        
        steps.push(async () => { // Step 4: Animate New Element In
            const newSize = currentArrayLengthAtPrep + 1;
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0, 12] : [0, 7]); 
            setMessage(`Animating ${val} in at index ${idx}...`);
            setProgramStateView(prev => ({...prev, status: "Animating new element...", final_size: newSize, current_size_after_op: newSize }));
            if (tempNewItemId) {
                await new Promise(resolve => setTimeout(() => {
                    animateElementIn(tempNewItemId!, 0); 
                    resolve(true);
                }, 50));
            }
            await new Promise(r => setTimeout(r, ANIMATION_DURATION * 1000 + 50));
        });

        if (codeLanguageMode === 'c') {
            steps.push(async () => { 
                const newSize = currentArrayLengthAtPrep + 1;
                setCurrentCodeLineHighlights([0, 10, 11, 13]); 
                setMessage(`Updating array size (C logic)...`);
                setProgramStateView(prev => ({...prev, status: "Incrementing size...", current_size_after_op: newSize }));
                await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2)); 
            });
        } else { 
            steps.push(async () => {
                const newSize = currentArrayLengthAtPrep + 1;
                setCurrentCodeLineHighlights([0, 8]); 
                setMessage("Python insert operation complete.");
                setProgramStateView(prev => ({...prev, status: "Function returns True", current_size_after_op: newSize}));
                await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
            });
        }
    } else if (op === 'delete_at') {
        steps.push(async () => {
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0,1,2,3] : [0,1,2,3]);
            setMessage(`Validating for delete at index ${idx}...`);
            setProgramStateView(prev => ({...prev, status: "Validating inputs..."}));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            if (array.length === 0) {
                const errorMsg = "Array is empty. Cannot delete.";
                setProgramStateView(prev => ({...prev, status: "Error: Array Empty"}));
                return Promise.reject(errorMsg);
            }
            if (isNaN(idx) || idx < 0 || idx >= array.length) {
                const errorMsg = `Invalid index. Must be between 0 and ${array.length - 1}.`;
                setProgramStateView(prev => ({...prev, status: "Error: Invalid Index"}));
                return Promise.reject(errorMsg);
            }
            setProgramStateView(prev => ({...prev, status: "Validation OK"}));
        });

        if (idx < array.length - 1) {
            if (codeLanguageMode === 'c') {
                steps.push(async () => {
                    setCurrentCodeLineHighlights([0,4,5]);
                    setMessage(`C: Shifting elements left from index ${idx}...`);
                    setProgramStateView(prev => ({
                        ...prev,
                        status: `Preparing C shift loop (i from ${idx} to ${array.length - 2})`,
                        c_loop_iterator_i: idx
                    }));
                    await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
                });
                const i_del=idx
                        const eld=elementsRef.current.get(array[i_del].id);
                        
                for (let i_loop = idx; i_loop < array.length - 1; i_loop++) {
                   
                    const elementToShiftId = array[i_loop + 1].id;
                    const originalElementValue = array[i_loop + 1].value;
                    steps.push(async () => {
                        setCurrentCodeLineHighlights([0,5,6,7]);
                        setMessage(`C Loop: Shifting element from index ${i_loop + 1} (value: ${originalElementValue}) to ${i_loop}...`);
                        setProgramStateView(prev => ({
                            ...prev,
                            status: `Loop: i = ${i_loop}. Shifting arr[${i_loop + 1}] to arr[${i_loop}]`,
                            c_loop_iterator_i: i_loop,
                            value_being_shifted: originalElementValue,
                        }));
                        const el = elementsRef.current.get(elementToShiftId);
                       
                        if (el) {
                            await gsap.to(el, {
                                x: `-=${ELEMENT_WIDTH_PX + 8}`,
                                duration: ANIMATION_DURATION / 1.2,
                                ease: 'power2.inOut',
                            }).then();
                        }
                        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
                    });
        
                }
                // --- Reset transforms for all shifted elements before removing from array ---
                steps.push(() => {
                                   const container = eld?.parentElement;
                                   if (container) {
  const newElement = document.createElement('div'); // Create new element ("X")
  newElement.textContent = 'X'; // Example content for "X"
  newElement.id = eld?.id || `replacement-${Date.now()}`; // Preserve ID or assign new one
  container.replaceChild(newElement, eld); // Replace eld with newElement
  if (eld?.id) {
    elementsRef.current.set(eld.id, newElement); // Update elementsRef with new element
  }
}
                    setCurrentCodeLineHighlights([0,8,9]);
                    
                    for (let i_reset = idx+1 ; i_reset < array.length; i_reset++) {
                        const idToReset = array[i_reset].id;
               
                        const el = elementsRef.current.get(idToReset);
                        if (el ) gsap.set(el, { x: 0 });
                    } 
                });
            } else if (codeLanguageMode === 'python') {
                steps.push(async () => {
                    setCurrentCodeLineHighlights([0,4]);
                    setMessage(`Visually shifting elements left for Python's pop...`);
                    setProgramStateView(prev => ({ ...prev, status: "Visual block shift for Python..." }));
                    for (let i = idx + 1; i < array.length; i++) {
                        const el = elementsRef.current.get(array[i].id);
                        if (el) {
                            await gsap.to(el, {
                                x: `-=${ELEMENT_WIDTH_PX + 8}`,
                                duration: ANIMATION_DURATION / 1.2,
                                ease: 'power2.inOut',
                            }).then();
                        }
                    }
                    for (let i_reset = idx + 1; i_reset < array.length; i_reset++) {
                        const idToReset = array[i_reset].id;
                        const el = elementsRef.current.get(idToReset);
                        if(el) gsap.set(el, {x: 0});
                    }
                });
            }
        }

        steps.push(() => {
            setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0,8,9] : [0,5,6]);
            setMessage(`Deleting element at index ${idx}...`);
  alert('Deleting element at index'+ array[idx].value );
            setProgramStateView(prev => ({...prev, status: `Deleting arr[${idx}]`}));
            setArray(prevArr => {
              
      const newArr = [...prevArr];
      
      newArr.splice(idx, 1);
      return newArr;
    });
});

steps.push(async () => {
    setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [0,10,11] : [0,7]);
    setMessage("Delete operation complete.");
    setProgramStateView(prev => ({...prev, status: "Function end."}));
    await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
});
    }
    else { 
        setMessage(`Operation '${op}' is not currently configured for step-by-step execution.`);
        setProgramStateView({ operation: op, status: "Not implemented for step-by-step." });
        steps.push(async () => { 
            setCurrentCodeLineHighlights([]);
            setMessage(`Operation ${op} selected (no steps defined).`);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        });
     }
    
    setOperationSteps(steps);
    setCurrentStepIndex(0);
    if (steps.length > 0) {
        setIsOperationActive(true); 
        setMessage(`Ready to ${op}. Click 'Next Step' or 'Start Auto'.`);
    } else { 
        setMessage(`Operation ${op} has no steps defined.`);
        setIsOperationActive(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [array, codeLanguageMode]); 

  const runNextStep = useCallback(async () => { /* ... as before ... */ 
    if (currentStepIndex >= operationSteps.length || !isOperationActive) {
      if (isOperationActive) finishOperation(); 
      return;
    }
    setIsStepExecuting(true); 
    const stepFunction = operationSteps[currentStepIndex];
    try {
      await stepFunction(); 
      if (currentStepIndex + 1 >= operationSteps.length) {
         finishOperation();
      } else {
         setCurrentStepIndex(prev => prev + 1);
      }
    } catch (errorMsgFromStep) { 
      console.error("Step execution failed:", errorMsgFromStep);
      finishOperation(typeof errorMsgFromStep === 'string' ? errorMsgFromStep : "An error occurred."); 
    } finally {
       setIsStepExecuting(false); 
    }
  }, [currentStepIndex, operationSteps, isOperationActive, finishOperation]);


  const triggerOperation = (op: Operation) => {
    if (isOperationActive && executionMode === 'auto' && !isStepExecuting) {  return; }
    if (isStepExecuting) { return; }
    if (timeoutRef.current) clearTimeout(timeoutRef.current); 
    
    setActiveOperationType(op); 
    
    setCurrentCodeLineHighlights([]); 
    setIsOperationActive(false); 
    setCurrentStepIndex(0);
    setOperationSteps([]);
    setExecutionMode('step'); 
    setProgramStateView({ operation: op, language: codeLanguageMode, status: "Waiting for input..." });

    // Open modal for append, insert_at, or delete_at
    if (['append', 'insert_at', 'delete_at'].includes(op)) { 
      setCurrentOperationForModal(op);
      setIsModalOpen(true);
    } else { 
      setMessage(`Operation '${op}' selected. (Setup for non-modal ops needed)`);
      setActiveOperationType(null); 
      const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
      setCurrentOperationCode(mapToUse.idle);
    }
  };

  const handleModalSubmit = (details: { value?: string; index?: string }) => { 
    setIsModalOpen(false); 
    if (activeOperationType) { 
      prepareOperation(activeOperationType, details);
    } else {
      console.error("Modal submitted but activeOperationType is null!");
      setActiveOperationType(null); 
      setCurrentOperationCode(codeLanguageMode === 'c' ? C_CODE_MAP.idle : PYTHON_CODE_MAP.idle);
    }
    setCurrentOperationForModal(null); 
  };
  const handleModalCancel = () => { 
    setIsModalOpen(false);
    setCurrentOperationForModal(null);
    setActiveOperationType(null); 
    setCurrentCodeLineHighlights([]);
    setIsOperationActive(false); 
    setOperationSteps([]); 
    setCurrentStepIndex(0);
    setProgramStateView({ note: "Operation cancelled." });
    setMessage("Operation cancelled by user.");
  };
  
  const handleStartAuto = useCallback(() => {
    if (!isOperationActive || operationSteps.length === 0 || isStepExecuting) {
        if(!isOperationActive) setMessage("No operation prepared. Select an operation first.");
        return;
    }
    if (currentStepIndex >= operationSteps.length) { 
        setMessage("Operation already completed. Reset or choose a new operation.");
        return;
    }
    setExecutionMode('auto');
  }, [isOperationActive, operationSteps.length, isStepExecuting, currentStepIndex]);

  const handleNextStepClick = useCallback(() => {
    if (!isOperationActive || operationSteps.length === 0 || isStepExecuting) {
        if(!isOperationActive) setMessage("No operation prepared. Select an operation first.");
        return;
    }
    if (currentStepIndex >= operationSteps.length) {
        setMessage("Operation completed.");
        finishOperation(); 
        return;
    }
    setExecutionMode('step'); 
    runNextStep();
  },[isOperationActive, operationSteps.length, isStepExecuting, currentStepIndex, runNextStep, finishOperation]);

  const handlePauseClick = useCallback(() => {
      if (!isOperationActive || executionMode !== 'auto') return;
      setExecutionMode('paused');
      if(timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage("Operation paused.");
  }, [isOperationActive, executionMode]);

  const handleResumeClick = useCallback(() => {
      if (!isOperationActive || executionMode !== 'paused') return;
      setExecutionMode('auto');
      setMessage("Resuming operation...");
  }, [isOperationActive, executionMode]);

  useEffect(() => { 
    if (executionMode === 'auto' && isOperationActive && !isStepExecuting && currentStepIndex < operationSteps.length) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (executionMode === 'auto' && isOperationActive && !isStepExecuting && currentStepIndex < operationSteps.length) { 
            runNextStep();
        }
      }, STEP_DELAY_MS);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [executionMode, runNextStep, isOperationActive, isStepExecuting, currentStepIndex, operationSteps.length]);


  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 p-4 text-white pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Array Operations Visualizer</h1>

      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6"> 
        <div className="flex-grow lg:w-[65%] flex flex-col gap-4"> 
            <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => triggerOperation('append')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-green-600 hover:bg-green-500">Append</button>
                    <button onClick={() => triggerOperation('insert_at')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-purple-600 hover:bg-purple-500">Insert At Index</button>
                    <button onClick={() => triggerOperation('delete_at')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-red-600 hover:bg-red-500">Delete At Index</button>
                </div>
            </div>
             <div className="w-full p-3 bg-gray-800 rounded-lg shadow-xl mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={handleStartAuto} disabled={!isOperationActive || executionMode === 'auto' || isStepExecuting || currentStepIndex >= operationSteps.length } className="btn-exec bg-sky-600 hover:bg-sky-500">Start Auto</button>
                    <button onClick={handlePauseClick} disabled={executionMode !== 'auto' || !isOperationActive } className="btn-exec bg-orange-500 hover:bg-orange-400">Pause</button>
                    <button onClick={handleResumeClick} disabled={executionMode !== 'paused' || !isOperationActive || isStepExecuting} className="btn-exec bg-sky-500 hover:bg-sky-400">Resume</button>
                    <button onClick={handleNextStepClick} disabled={executionMode === 'auto' || !isOperationActive || isStepExecuting || currentStepIndex >= operationSteps.length} className="btn-exec bg-indigo-500 hover:bg-indigo-400">Next Step</button>
                </div>
            </div>


            <div className="mb-4 h-6 text-sm text-yellow-400 text-center font-medium">
                {message || <>&nbsp;</>}
            </div>

            <div className="w-full min-h-[150px] bg-gray-800/60 p-4 rounded-lg border border-gray-700 flex items-center justify-center shadow-inner">
                <div ref={elementsContainerRef} className="flex flex-wrap items-center justify-center space-x-2 h-full">
                {array.map((item, index) => (
                    <div key={item.id} className="flex flex-col items-center"> 
                    <div
                        ref={el => { elementsRef.current.set(item.id, el); }}
                        className={`flex items-center justify-center rounded-lg text-xl font-bold transition-all duration-200
                                    border-t-2 border-l-2 border-r-2 border-b-4 
                                    ${highlightedIndex === index 
                                    ? 'border-yellow-300 border-b-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 scale-110 shadow-2xl brightness-125' 
                                    : 'border-sky-400 border-b-sky-700 bg-gradient-to-br from-sky-500 to-sky-700 shadow-lg'}`}
                        style={{ opacity: 0, width: `${ELEMENT_WIDTH_PX}px`, height: `${ELEMENT_HEIGHT_PX}px`}}
                    >
                        {item.value}
                    </div>
              { !hideIndex && <div className="mt-1 text-xs text-gray-400">[{index}]</div>}
                    </div>
                ))}
                {array.length === 0 && (<p className="text-gray-500 italic">Array is empty.</p>)}
                </div>
            </div>
            {/* Program State Panel */}
            <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mt-4">
                <h3 className="text-lg font-semibold text-sky-400 mb-2 border-b border-gray-700 pb-1">Program State</h3>
                {Object.keys(programStateView).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(programStateView).map(([key, value]) => (
                            <div key={key} className="flex">
                                <span className="font-medium text-gray-400 mr-2">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-yellow-300">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No operation active or state to display.</p>
                )}
            </div>
        </div>

        <div className="lg:w-[35%] p-4 bg-gray-800 rounded-lg shadow-xl h-fit sticky top-6"> 
          <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-2">
            <h3 className="text-lg font-semibold text-sky-400">Code</h3>
            <div className="flex space-x-1">
                <button 
                    onClick={() => setCodeLanguageMode('c')}
                    className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'c' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >C</button>
                <button 
                    onClick={() => setCodeLanguageMode('python')}
                    className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'python' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >Python</button>
            </div>
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-[450px] lg:max-h-full text-left">
            {currentOperationCode.map((line, index) => (
              <div
                key={`code-${index}`}
                className={`p-1 rounded my-0.5 transition-colors duration-200 ${currentCodeLineHighlights.includes(index) ? 'bg-yellow-500/30 text-yellow-200 font-semibold' : 'text-gray-300'}`}
              >
                <span className="mr-2 select-none text-gray-500">{String(index).padStart(2, ' ')}:</span>
                {line}
              </div>
            ))}
          </pre>
        </div>
      </div>
      
      <OperationModal 
        isOpen={isModalOpen} operation={currentOperationForModal}
        onClose={handleModalCancel} 
        onSubmit={handleModalSubmit} currentArrayLength={array.length}
      />

      <style jsx global>{`
        .btn-op, .btn-exec { 
            padding: 0.6rem 0.5rem; font-size: 0.8rem; border-radius: 0.375rem; color: white;
            transition: background-color 0.2s, transform 0.1s, opacity 0.2s; font-weight: 500; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .btn-op:hover:not(:disabled), .btn-exec:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.25); }
        .btn-op:active:not(:disabled), .btn-exec:active:not(:disabled) { transform: translateY(0px); }
        .btn-op:disabled, .btn-exec:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <p className="mt-8 text-xs text-gray-400">
        Array Operations Visualizer | Next.js, TypeScript, GSAP, Tailwind CSS
      </p>
    </div>
  );
};

export default ArrayOperationsVisualizer;

