// components/QueueOperationsVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

// --- Constants ---
const MAX_QUEUE_SIZE = 8;
const ANIMATION_DURATION = 0.5; // seconds
const STEP_DELAY_MS = 500; // Delay between automatic steps
const ELEMENT_WIDTH_PX = 60;
const ELEMENT_HEIGHT_PX = 60;
const ELEMENT_SPACING_PX = 8;

// --- Interfaces and Types ---
interface QueueElement {
  id: string;
  value: string | number;
}

type Operation =
  | 'idle'
  | 'enqueue'
  | 'dequeue'
  | 'front'; // 'front' is like 'peek' for a queue

interface ModalProps {
  isOpen: boolean;
  operation: Operation | null;
  onClose: () => void;
  onSubmit: (details: { value?: string }) => void;
}

// --- C Language Code Definitions (Queue - Simple Linear Array Implementation) ---
const C_CODE_MAP: Record<Operation | 'idle' | 'is_empty' | 'is_full', string[]> = {
  idle: ["// Select a queue operation to see the C code."],
  is_empty: [
    "// Assuming: int front, rear, size;",
    "int isEmpty(Queue* q) {",
    "  return q->size == 0;",
    "}"
  ],
  is_full: [
    "// Assuming: int size, capacity;",
    "int isFull(Queue* q) {",
    `  return q->size == q->capacity; // capacity is ${MAX_QUEUE_SIZE}`,
    "}"
  ],
  enqueue: [
    "// Simple array-based queue (rear is end of array, front is 0)",
    "void enqueue(Queue* q, int value) {",              // 0
    "  // 1. Check if Queue is Full",                   // 1
    "  if (q->size == q->capacity) {",                  // 2
    "    printf(\"Queue is Full!\\n\");",                // 3
    "    return;",                                      // 4
    "  }",                                              // 5
    "  // 2. Add item to the rear (end of array)",      // 6
    "  // (Conceptually, rear index increments, or simply add to list end)", // 7
    "  q->items[q->rear_idx_for_add] = value; // Simplification for viz",      // 8
    "  q->size++;",                                     // 9
    "  // (Visual: element appears at rear)",           // 10
    "}",                                                // 11
  ],
  dequeue: [
    "// Simple array-based queue (rear is end of array, front is 0)",
    "int dequeue(Queue* q) {",                          // 0
    "  // 1. Check if Queue is Empty",                  // 1
    "  if (q->size == 0) {",                            // 2
    "    printf(\"Queue is Empty!\\n\");",               // 3
    "    return -1; // Error or special value",         // 4
    "  }",                                              // 5
    "  // 2. Get item from the front",                  // 6
    "  int item = q->items[q->front_idx]; // front_idx is 0", // 7
    "  // 3. Shift all other elements to the left (for simple array)", // 8
    "  for (int i = 0; i < q->size - 1; i++) {",        // 9
    "    q->items[i] = q->items[i+1];",                 // 10
    "  }",                                              // 11
    "  q->size--;",                                     // 12
    "  // (Visual: front element disappears, others shift)",// 13
    "  return item;",                                   // 14
    "}",                                                // 15
  ],
  front: [
    "// Simple array-based queue (rear is end of array, front is 0)",
    "int front(Queue* q) {",                           // 0
    "  // 1. Check if Queue is Empty",                  // 1
    "  if (q->size == 0) {",                            // 2
    "    printf(\"Queue is Empty!\\n\");",               // 3
    "    return -1; // Error or special value",         // 4
    "  }",                                              // 5
    "  // 2. Return item from the front",               // 6
    "  return q->items[q->front_idx]; // front_idx is 0",// 7
    "  // (Visual: front element is highlighted)",      // 8
    "}",                                                // 9
  ],
};

// --- Python Code Definitions (Queue) ---
const PYTHON_CODE_MAP: Record<Operation | 'idle' | 'is_empty' | 'is_full', string[]> = {
  idle: ["# Select a queue operation to see the Python code."],
  is_empty: [
    "def is_empty(queue_list):",
    "  return len(queue_list) == 0"
  ],
  is_full: [
    "def is_full(queue_list, capacity):",
    `  return len(queue_list) >= capacity # capacity is ${MAX_QUEUE_SIZE}`
  ],
  enqueue: [
    "def enqueue_item(queue_list, value, capacity):",  // 0
    "  # 1. Check if Queue is Full (conceptual for viz)", // 1
    "  if len(queue_list) >= capacity:",             // 2
    "    print(\"Queue is Full!\")",                  // 3
    "    return False",                             // 4
    "  # 2. Add item to the rear (end of list)",    // 5
    "  queue_list.append(value)",                   // 6
    "  # (Visual: element appears at rear)",        // 7
    "  return True",                                // 8
  ],
  dequeue: [
    "def dequeue_item(queue_list):",                // 0
    "  # 1. Check if Queue is Empty",               // 1
    "  if not queue_list:",                         // 2
    "    print(\"Queue is Empty!\")",                // 3
    "    return None",                              // 4
    "  # 2. Remove and return item from the front", // 5
    "  item = queue_list.pop(0)",                   // 6
    "  # (Visual: front element disappears)",       // 7
    "  return item",                                // 8
  ],
  front: [
    "def front_item(queue_list):",                  // 0
    "  # 1. Check if Queue is Empty",               // 1
    "  if not queue_list:",                         // 2
    "    print(\"Queue is Empty!\")",                // 3
    "    return None",                              // 4
    "  # 2. Return item from the front",            // 5
    "  return queue_list[0]",                       // 6
    "  # (Visual: front element is highlighted)",   // 7
  ],
};

// --- Operation Modal (Simplified for Queue) ---
const OperationModal: React.FC<ModalProps> = ({ isOpen, operation, onClose, onSubmit }) => {
  const [modalValue, setModalValue] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModalValue('');
      setModalError('');
    }
  }, [isOpen]);

  if (!isOpen || !operation) return null;

  const needsValue = operation === 'enqueue';

  const handleSubmit = () => {
    setModalError('');
    if (needsValue && !modalValue.trim()) {
      setModalError('Value cannot be empty for Enqueue operation.');
      return;
    }
    onSubmit({ value: modalValue });
  };

  const getOperationName = (op: Operation) => {
    if (op === 'enqueue') return 'Enqueue Value';
    if (op === 'dequeue') return 'Dequeue Value';
    if (op === 'front') return 'View Front Value';
    return 'Queue Operation';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-sky-400">{getOperationName(operation)}</h2>
        {modalError && <p className="text-red-400 text-sm mb-3">{modalError}</p>}
        {needsValue && (
          <div className="mb-4">
            <label htmlFor="modalValue" className="block text-sm font-medium text-gray-300 mb-1">Value to Enqueue:</label>
            <input
              type="text" id="modalValue" value={modalValue} onChange={(e) => setModalValue(e.target.value)}
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


// --- Main Queue Visualizer Component ---
const QueueOperationsVisualizer: React.FC = () => {
  const [queue, setQueue] = useState<QueueElement[]>([]);
  const [message, setMessage] = useState<string>('Choose a queue operation.');
  const [highlightedIndices, setHighlightedIndices] = useState<('front' | 'rear' | number)[]>([]);
  const [dequeuedValue, setDequeuedValue] = useState<string | number | null>(null);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperationForModal, setCurrentOperationForModal] = useState<Operation | null>(null);
  const [activeOperationType, setActiveOperationType] = useState<Operation | null>(null);

  const [codeLanguageMode, setCodeLanguageMode] = useState<'c' | 'python'>('c');
  const [currentOperationCode, setCurrentOperationCode] = useState<string[]>(C_CODE_MAP.idle);
  const [currentCodeLineHighlights, setCurrentCodeLineHighlights] = useState<number[]>([]);
  const [programStateView, setProgramStateView] = useState<Record<string, string | number | null | undefined>>({
    front_idx: -1, // For conceptual C code; in JS array, front is always 0 if not empty
    rear_idx: -1,  // For conceptual C code; in JS array, rear is length - 1
    current_size: 0,
    capacity: MAX_QUEUE_SIZE,
  });

  const [operationSteps, setOperationSteps] = useState<Array<() => Promise<void> | void>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [isStepExecuting, setIsStepExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'idle' | 'step' | 'auto' | 'paused'>('idle');

  const elementsContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initial Queue (Optional)
  useEffect(() => {
    const initialData: QueueElement[] = [
      { id: generateId(), value: 10 }, { id: generateId(), value: 20 }, { id: generateId(), value: 30 },
    ];
    setQueue(initialData);
    setMessage('Default queue loaded. Choose an operation.');
    setProgramStateView({
        front_idx: initialData.length > 0 ? 0 : -1,
        rear_idx: initialData.length > 0 ? initialData.length - 1 : -1,
        current_size: initialData.length,
        capacity: MAX_QUEUE_SIZE,
        status: "Initial Queue"
    });


    setTimeout(() => {
      initialData.forEach((item, index) => {
        const el = elementsRef.current.get(item.id);
        if (el) {
          gsap.set(el, { opacity: 0, scale: 0.3, x: 30 }); // Animate from right
          gsap.to(el, {
            opacity: 1, scale: 1, x: 0, duration: ANIMATION_DURATION * 1.5,
            delay: index * 0.1, ease: 'elastic.out(1, 0.75)',
          });
        }
      });
    }, 100);
  }, []);

  // --- Animation Functions ---
  const animateElementIn = (elementId: string, delay: number = 0) => { // Enqueue (from right)
    const el = elementsRef.current.get(elementId);
    if (el) {
      gsap.set(el, { opacity: 0, scale: 0.7, x: ELEMENT_WIDTH_PX / 2 });
      gsap.to(el, {
        opacity: 1, scale: 1, x: 0,
        duration: ANIMATION_DURATION, delay, ease: 'back.out(1.7)'
      });
    }
  };

  const animateElementOut = async (elementId: string) => { // Dequeue (to left)
    const el = elementsRef.current.get(elementId);
    if (el) {
      await gsap.to(el, {
        opacity: 0, scale: 0.7, x: -ELEMENT_WIDTH_PX / 1.5,
        duration: ANIMATION_DURATION, ease: 'power2.in'
      }).then();
    }
  };

  const animateShiftLeft = async (startIndex: number) => {
    const elementsToShift: HTMLElement[] = [];
    // Collect elements from startIndex to end
    for (let i = startIndex; i < queue.length; i++) { // Use current queue state for IDs
        const item = queue[i];
        if (item) {
            const el = elementsRef.current.get(item.id);
            if (el) elementsToShift.push(el);
        }
    }

    if (elementsToShift.length > 0) {
        await gsap.to(elementsToShift, {
            x: `-=${ELEMENT_WIDTH_PX + ELEMENT_SPACING_PX}`, // Shift left by one element's width + spacing
            duration: ANIMATION_DURATION / 1.2,
            ease: 'power2.inOut',
            stagger: 0.05,
        }).then();
        // Reset transforms immediately as React will re-render them in their new logical positions
        gsap.set(elementsToShift, { x: 0 });
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
    setHighlightedIndices([]);
    setDequeuedValue(null);
    if (statusMessage) {
      setMessage(statusMessage);
    } else {
      setMessage(prev => prev.includes("...") ? prev.replace("...", " completed.") : `${activeOperationType || 'Operation'} finished.`);
    }
    const currentQSize = queue.length; // Get fresh queue length
    setProgramStateView(prev => ({
        ...prev,
        status: statusMessage || "Completed",
        dequeued_value: undefined,
        front_value: undefined,
        current_size: currentQSize,
        front_idx: currentQSize > 0 ? 0 : -1,
        rear_idx: currentQSize > 0 ? currentQSize - 1 : -1,
    }));
  }, [activeOperationType, queue]); // Added queue dependency


  const prepareOperation = useCallback(async (op: Operation, details: { value?: string }) => {
    if (isOperationActive && executionMode === 'auto') {
      setMessage("Operation in auto mode. Please pause or wait.");
      return;
    }
    setDequeuedValue(null);
    setIsStepExecuting(false);
    setHighlightedIndices([]);

    const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
    setCurrentOperationCode(mapToUse[op] || mapToUse.idle);
    setCurrentCodeLineHighlights([0]);
    setMessage(`Preparing to ${op}...`);

    const currentQueueSize = queue.length;

    const initialProgramState: Record<string, any> = {
      operation: op,
      language: codeLanguageMode,
      status: "Preparing...",
      front_idx: currentQueueSize > 0 ? 0 : -1,
      rear_idx: currentQueueSize > 0 ? currentQueueSize -1 : -1,
      current_size: currentQueueSize,
      capacity: MAX_QUEUE_SIZE,
    };
     if (op === 'enqueue') {
      initialProgramState.value_to_enqueue = details.value?.trim() || '';
    }
    setProgramStateView(initialProgramState);

    const val = details.value?.trim() || '';
    let tempNewItemId: string | null = null;
    let steps: Array<() => Promise<void> | void> = [];

    // --- ENQUEUE Operation Steps ---
    if (op === 'enqueue') {
      steps.push(async () => { // 1. Validate (Queue Full)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for enqueue: Is queue full?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking capacity..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentQueueSize >= MAX_QUEUE_SIZE) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Queue is Full! Cannot enqueue (max ${MAX_QUEUE_SIZE} items).`;
          setProgramStateView(prev => ({ ...prev, status: "Error: Queue Full" }));
          return Promise.reject(errorMsg);
        }
        setProgramStateView(prev => ({ ...prev, status: "Validation OK: Queue has space" }));
      });

      steps.push(async () => { // 2. Perform Enqueue: Add element to rear
        const cLines = [6,7,8,9,10]; // Conceptual rear update, add, size++
        const pyLines = [5,6,7];
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Enqueueing ${val} at the rear...`);
        const newRearIdx = currentQueueSize; // New element will be at this index
        setProgramStateView(prev => ({
            ...prev,
            status: `Logically adding ${val} to rear`,
            rear_idx: newRearIdx,
            value_being_enqueued: val,
            front_idx: currentQueueSize === 0 ? newRearIdx : prev.front_idx // Update front if it was empty
        }));
        setHighlightedIndices(['rear']);


        const newItem: QueueElement = { id: generateId(), value: val };
        tempNewItemId = newItem.id;

        setQueue(prevQueue => [...prevQueue, newItem]);

        await new Promise(resolve => setTimeout(() => {
          if (tempNewItemId) animateElementIn(tempNewItemId);
          resolve(true);
        }, 50));
         await new Promise(r => setTimeout(r, ANIMATION_DURATION * 1000 + 50));
      });

      steps.push(async () => { // 3. Update Size & Finish
         const cLines = [11];
         const pyLines = [8];
         setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Enqueue operation for ${val} complete.`);
        const newSize = currentQueueSize + 1;
        setProgramStateView(prev => ({
            ...prev,
            status: "Enqueue complete",
            current_size: newSize,
            rear_idx: newSize - 1, // Actual rear index
            front_idx: newSize > 0 ? 0 : -1, // Front is always 0 if not empty
            value_being_enqueued: undefined
        }));
        setHighlightedIndices([]);
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });
    }
    // --- DEQUEUE Operation Steps ---
    else if (op === 'dequeue') {
      let dequeuedItemValue: string | number | undefined = undefined;
      let itemToDequeueId: string | undefined = undefined;

      steps.push(async () => { // 1. Validate (Queue Empty)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for dequeue: Is queue empty?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking if queue is empty..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentQueueSize === 0) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Queue is Empty! Cannot dequeue.`;
          setProgramStateView(prev => ({ ...prev, status: "Error: Queue Empty" }));
          return Promise.reject(errorMsg);
        }
        setProgramStateView(prev => ({ ...prev, status: "Validation OK: Queue is not empty" }));
      });

      steps.push(async () => { // 2. Get front element and Animate Out
        const cLines = [6,7,13]; // Get item, (animate shift later)
        const pyLines = [5,6,7]; // Pop(0) and animate
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);

        const itemToDequeue = queue[0]; // Front element
        dequeuedItemValue = itemToDequeue.value;
        itemToDequeueId = itemToDequeue.id;
        setDequeuedValue(dequeuedItemValue);

        setMessage(`Dequeuing ${dequeuedItemValue} from the front...`);
        setProgramStateView(prev => ({ ...prev, status: `Animating dequeue of ${dequeuedItemValue}`, value_being_dequeued: dequeuedItemValue }));
        setHighlightedIndices(['front']); // Highlight front element

        if(itemToDequeueId) await animateElementOut(itemToDequeueId);
        setHighlightedIndices([]);
      });

      if (codeLanguageMode === 'c' && currentQueueSize > 1) { // C code shows element shifting
          steps.push(async () => {
              setCurrentCodeLineHighlights([8,9,10,11]);
              setMessage("Shifting remaining elements to the left (C visualization)...");
              setProgramStateView(prev => ({ ...prev, status: "Visualizing element shift..."}));

              // Create a temporary array *without* the first element for IDs to shift
              const shiftedQueue = queue.slice(1);
              const elementsToShiftRefs: HTMLElement[] = [];
              shiftedQueue.forEach(item => {
                  const el = elementsRef.current.get(item.id);
                  if (el) elementsToShiftRefs.push(el);
              });

              if(elementsToShiftRefs.length > 0) {
                await gsap.to(elementsToShiftRefs, {
                    x: `-=${ELEMENT_WIDTH_PX + ELEMENT_SPACING_PX}`,
                    duration: ANIMATION_DURATION / 1.2,
                    ease: 'power2.inOut',
                    stagger: 0.03
                }).then();
                gsap.set(elementsToShiftRefs, {x: 0}); // Reset immediately
              }
              await new Promise(r => setTimeout(r, STEP_DELAY_MS /2));
          });
      }


      steps.push(async () => { // 3. Update State (Remove from JS array, update size/indices)
        const cLines = [12,14,15]; // size--, return
        const pyLines = [8];       // return
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Element ${dequeuedItemValue} dequeued.`);

        // Perform actual dequeue from state
        setQueue(prevQueue => prevQueue.slice(1));

        const newSize = currentQueueSize - 1;
        setProgramStateView(prev => ({
            ...prev,
            status: "Dequeue complete",
            current_size: newSize,
            front_idx: newSize > 0 ? 0 : -1,
            rear_idx: newSize > 0 ? newSize - 1 : -1,
            dequeued_value: dequeuedItemValue,
            value_being_dequeued: undefined
        }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });
    }
    // --- FRONT (PEEK) Operation Steps ---
    else if (op === 'front') {
      steps.push(async () => { // 1. Validate (Queue Empty)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for front: Is queue empty?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking if queue is empty..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentQueueSize === 0) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Queue is Empty! Cannot get front element.`;
           setProgramStateView(prev => ({ ...prev, status: "Error: Queue Empty" }));
          return Promise.reject(errorMsg);
        }
         setProgramStateView(prev => ({ ...prev, status: "Validation OK: Queue is not empty" }));
      });

      steps.push(async () => { // 2. Highlight and show front element
        const cLines = [6,7,8,9];
        const pyLines = [5,6,7];
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        const frontItem = queue[0];
        setMessage(`Front element is: ${frontItem.value}.`);
        setProgramStateView(prev => ({ ...prev, status: `Front element: ${frontItem.value}`, front_value: frontItem.value }));
        setHighlightedIndices(['front']); // Highlight front element

        const el = elementsRef.current.get(frontItem.id);
        if (el) {
            gsap.to(el, { scale: 1.1, duration: ANIMATION_DURATION/2, yoyo: true, repeat: 1, ease: "power1.inOut" });
        }
        await new Promise(r => setTimeout(r, STEP_DELAY_MS + ANIMATION_DURATION * 1000));
      });

       steps.push(async () => { // 3. Finish Front
        setMessage(`Front operation complete.`);
        setProgramStateView(prev => ({ ...prev, status: "Front complete"}));
        setHighlightedIndices([]);
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });
    } else {
      setMessage(`Operation '${op}' is not configured.`);
      steps.push(async () => { /* ... */ });
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
  }, [queue, codeLanguageMode, executionMode, isOperationActive]);

  const runNextStep = useCallback(async () => {
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
      finishOperation(typeof errorMsgFromStep === 'string' ? errorMsgFromStep : "An error occurred during the operation.");
    } finally {
      setIsStepExecuting(false);
    }
  }, [currentStepIndex, operationSteps, isOperationActive, finishOperation]);

  const triggerOperation = (op: Operation) => {
    if (isOperationActive && executionMode === 'auto' && !isStepExecuting) { return; }
    if (isStepExecuting) { return; }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDequeuedValue(null);
    setActiveOperationType(op);
    setCurrentCodeLineHighlights([]);
    setIsOperationActive(false);
    setCurrentStepIndex(0);
    setOperationSteps([]);
    setExecutionMode('step');
    const currentQSize = queue.length;
    setProgramStateView(prev => ({
        ...prev,
        operation: op,
        language: codeLanguageMode,
        status: "Waiting for input...",
        dequeued_value: undefined,
        front_value: undefined,
        current_size: currentQSize,
        front_idx: currentQSize > 0 ? 0 : -1,
        rear_idx: currentQSize > 0 ? currentQSize -1 : -1,
    }));


    if (op === 'enqueue') {
      setCurrentOperationForModal(op);
      setIsModalOpen(true);
    } else if (op === 'dequeue' || op === 'front') {
      prepareOperation(op, {});
    } else {
      setMessage(`Operation '${op}' selected.`);
      setActiveOperationType(null);
      const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
      setCurrentOperationCode(mapToUse.idle);
    }
  };

  const handleModalSubmit = (details: { value?: string }) => {
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
    const currentQSize = queue.length;
    setProgramStateView(prev => ({
        ...prev,
        note: "Operation cancelled.",
        status: "Cancelled",
        current_size: currentQSize,
        front_idx: currentQSize > 0 ? 0 : -1,
        rear_idx: currentQSize > 0 ? currentQSize -1 : -1,
    }));
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
    setMessage("Starting auto execution...");
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
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Queue Operations Visualizer 🚶‍♂️🚶‍♀️🚶</h1>
       {dequeuedValue !== null && (
        <p className="text-xl text-orange-400 mb-4">Dequeued: {dequeuedValue}</p>
      )}

      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
        {/* Left Panel: Controls, Visualization, Program State */}
        <div className="flex-grow lg:w-[65%] flex flex-col gap-4">
          {/* Operation Buttons */}
          <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => triggerOperation('enqueue')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-green-600 hover:bg-green-500">Enqueue</button>
              <button onClick={() => triggerOperation('dequeue')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-red-600 hover:bg-red-500">Dequeue</button>
              <button onClick={() => triggerOperation('front')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-blue-600 hover:bg-blue-500">Front</button>
            </div>
          </div>
           {/* Execution Controls */}
          <div className="w-full p-3 bg-gray-800 rounded-lg shadow-xl mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button onClick={handleStartAuto} disabled={!isOperationActive || executionMode === 'auto' || isStepExecuting || currentStepIndex >= operationSteps.length } className="btn-exec bg-sky-600 hover:bg-sky-500">Start Auto</button>
                <button onClick={handlePauseClick} disabled={executionMode !== 'auto' || !isOperationActive } className="btn-exec bg-orange-500 hover:bg-orange-400">Pause</button>
                <button onClick={handleResumeClick} disabled={executionMode !== 'paused' || !isOperationActive || isStepExecuting} className="btn-exec bg-sky-500 hover:bg-sky-400">Resume</button>
                <button onClick={handleNextStepClick} disabled={executionMode === 'auto' || !isOperationActive || isStepExecuting || currentStepIndex >= operationSteps.length} className="btn-exec bg-indigo-500 hover:bg-indigo-400">Next Step</button>
            </div>
          </div>

          {/* Message Bar */}
          <div className="mb-4 h-6 text-sm text-yellow-400 text-center font-medium">
            {message || <>&nbsp;</>}
          </div>

          {/* Queue Visualization (Horizontal: Front on Left, Rear on Right) */}
            <div className="w-full min-h-[100px] bg-gray-800/60 p-4 rounded-lg border-2 border-gray-700 flex items-end justify-start shadow-inner relative overflow-x-auto"
                style={{ minHeight: `${ELEMENT_HEIGHT_PX + 60}px` }} // Ensure enough height for labels
            >
                <div ref={elementsContainerRef} className="flex flex-row items-end h-full relative">
                    {queue.map((item, index) => {
                        const isFront = index === 0;
                        const isRear = index === queue.length - 1;
                        return (
                            <div key={item.id} className="flex flex-col items-center relative" style={{ marginRight: ELEMENT_SPACING_PX }}>
                                {(isFront && queue.length > 0) && (
                                    <div className="text-xs text-lime-400 mb-1 absolute -top-5 left-1/2 transform -translate-x-1/2 px-1 bg-gray-900 rounded">FRONT</div>
                                )}
                                {(isRear && queue.length > 0) && (
                                     <div className="text-xs text-purple-400 mb-1 absolute -bottom-5 left-1/2 transform -translate-x-1/2 px-1 bg-gray-900 rounded">REAR</div>
                                )}
                                <div
                                    ref={el => { elementsRef.current.set(item.id, el); }}
                                    className={`flex items-center justify-center rounded-md text-xl font-bold transition-all duration-200
                                                border-t-2 border-l-2 border-r-2 border-b-4
                                                ${(highlightedIndices.includes('front') && isFront) || (highlightedIndices.includes('rear') && isRear) || highlightedIndices.includes(index)
                                                ? 'border-yellow-300 border-b-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 scale-105 shadow-2xl brightness-125'
                                                : 'border-sky-400 border-b-sky-700 bg-gradient-to-br from-sky-500 to-sky-700 shadow-lg'}`}
                                    style={{
                                        opacity: 0, // Initial opacity for GSAP
                                        width: `${ELEMENT_WIDTH_PX}px`,
                                        height: `${ELEMENT_HEIGHT_PX}px`,
                                    }}
                                >
                                    {item.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {queue.length === 0 && (<p className="absolute inset-0 flex items-center justify-center text-gray-500 italic">Queue is empty.</p>)}
            </div>


          {/* Program State Panel */}
          <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mt-4">
            <h3 className="text-lg font-semibold text-sky-400 mb-2 border-b border-gray-700 pb-1">Program State</h3>
            {Object.keys(programStateView).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(programStateView).map(([key, value]) => (
                        <div key={key} className="flex">
                            <span className="font-medium text-gray-400 mr-2 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-yellow-300">{String(value === undefined || value === null ? "N/A" : value)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No operation active or state to display.</p>
            )}
          </div>
        </div>

        {/* Right Panel: Code Display */}
        <div className="lg:w-[35%] p-4 bg-gray-800 rounded-lg shadow-xl h-fit sticky top-6">
          <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-2">
            <h3 className="text-lg font-semibold text-sky-400">Code</h3>
            <div className="flex space-x-1">
                <button onClick={() => setCodeLanguageMode('c')} className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'c' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>C</button>
                <button onClick={() => setCodeLanguageMode('python')} className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'python' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Python</button>
            </div>
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-[450px] lg:max-h-[calc(100vh-120px)] text-left">
            {currentOperationCode.map((line, index) => (
                <div key={`code-${index}`} className={`p-1 rounded my-0.5 transition-colors duration-200 ${currentCodeLineHighlights.includes(index) ? 'bg-yellow-500/30 text-yellow-200 font-semibold' : 'text-gray-300'}`}>
                    <span className="mr-2 select-none text-gray-500">{String(index).padStart(2, '0')}:</span>
                    {line}
                </div>
            ))}
          </pre>
        </div>
      </div>

      <OperationModal
        isOpen={isModalOpen} operation={currentOperationForModal}
        onClose={handleModalCancel}
        onSubmit={handleModalSubmit}
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
        Queue Operations Visualizer | Next.js, TypeScript, GSAP, Tailwind CSS
      </p>
    </div>
  );
};

export default QueueOperationsVisualizer;