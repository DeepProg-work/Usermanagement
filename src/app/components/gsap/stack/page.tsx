// components/StackOperationsVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

// --- Constants ---
const MAX_STACK_SIZE = 8; // Adjusted for typical stack visualization
const ANIMATION_DURATION = 0.5; // seconds
const STEP_DELAY_MS = 500; // Delay between automatic steps
const ELEMENT_WIDTH_PX = 60;
const ELEMENT_HEIGHT_PX = 60;
const ELEMENT_SPACING_PX = 8; // For horizontal layout

// --- Interfaces and Types ---
interface StackElement {
  id: string;
  value: string | number;
}

type Operation =
  | 'idle'
  | 'push'
  | 'pop'
  | 'peek';

interface ModalProps {
  isOpen: boolean;
  operation: Operation | null;
  onClose: () => void;
  onSubmit: (details: { value?: string }) => void; // Index not needed for stack
  // currentStackSize: number; // Might not be needed for modal validation directly
}

// --- C Language Code Definitions (Stack) ---
const C_CODE_MAP: Record<Operation | 'idle' | 'is_empty' | 'is_full', string[]> = {
  idle: ["// Select a stack operation to see the C code."],
  is_empty: [
    "int isEmpty(Stack* s) {",
    "  return s->top == -1;",
    "}"
  ],
  is_full: [
    "int isFull(Stack* s) {",
    `  return s->top == s->capacity - 1; // capacity is ${MAX_STACK_SIZE}`,
    "}"
  ],
  push: [
    "// Assuming Stack struct: int items[MAX_SIZE]; int top; int capacity;",
    "void push(Stack* s, int value) {", // 0
    "  // 1. Check for Stack Overflow",   // 1
    "  if (s->top >= s->capacity - 1) {",// 2
    "    printf(\"Stack Overflow!\\n\");", // 3
    "    return;",                        // 4
    "  }",                               // 5
    "  // 2. Increment top",             // 6
    "  s->top++;",                       // 7
    "  // 3. Insert value",              // 8
    "  s->items[s->top] = value;",       // 9
    "  // (Element visually appears now)",// 10
    "}",                                 // 11
  ],
  pop: [
    "// Assuming Stack struct: int items[MAX_SIZE]; int top; int capacity;",
    "int pop(Stack* s) {",               // 0
    "  // 1. Check for Stack Underflow",  // 1
    "  if (s->top == -1) {",             // 2
    "    printf(\"Stack Underflow!\\n\");",// 3
    "    return -1; // Error or special value", // 4
    "  }",                               // 5
    "  // 2. Get top element's value",   // 6
    "  int item = s->items[s->top];",    // 7
    "  // 3. Decrement top",             // 8
    "  s->top--;",                       // 9
    "  // (Element visually disappears now)",//10
    "  return item;",                    // 11
    "}",                                 // 12
  ],
  peek: [
    "// Assuming Stack struct: int items[MAX_SIZE]; int top; int capacity;",
    "int peek(Stack* s) {",              // 0
    "  // 1. Check if Stack is Empty",    // 1
    "  if (s->top == -1) {",             // 2
    "    printf(\"Stack is Empty!\\n\");", // 3
    "    return -1; // Error or special value",// 4
    "  }",                               // 5
    "  // 2. Return top element's value", // 6
    "  return s->items[s->top];",        // 7
    "  // (Top element is highlighted)",  // 8
    "}",                                 // 9
  ],
};

// --- Python Code Definitions (Stack) ---
const PYTHON_CODE_MAP: Record<Operation | 'idle' | 'is_empty' | 'is_full', string[]> = {
  idle: ["# Select a stack operation to see the Python code."],
  is_empty: [
    "def is_empty(stack_list):",
    "  return len(stack_list) == 0"
  ],
  is_full: [
    "def is_full(stack_list, capacity):",
    `  return len(stack_list) >= capacity # capacity is ${MAX_STACK_SIZE}`
  ],
  push: [
    "def push_to_stack(stack_list, value, capacity):", // 0
    "  # 1. Check for Stack Overflow (conceptual for fixed-size viz)", // 1
    "  if len(stack_list) >= capacity:",           // 2
    "    print(\"Stack Overflow!\")",               // 3
    "    return False",                           // 4
    "  # 2. Add value to the end (top of stack)", // 5
    "  stack_list.append(value)",                 // 6
    "  # (Element visually appears now)",         // 7
    "  return True",                              // 8
  ],
  pop: [
    "def pop_from_stack(stack_list):",            // 0
    "  # 1. Check for Stack Underflow",           // 1
    "  if not stack_list:",                       // 2
    "    print(\"Stack Underflow!\")",             // 3
    "    return None",                            // 4
    "  # 2. Remove and return top element",       // 5
    "  item = stack_list.pop()",                  // 6
    "  # (Element visually disappears now)",      // 7
    "  return item",                              // 8
  ],
  peek: [
    "def peek_stack(stack_list):",                // 0
    "  # 1. Check if Stack is Empty",             // 1
    "  if not stack_list:",                       // 2
    "    print(\"Stack is Empty!\")",              // 3
    "    return None",                            // 4
    "  # 2. Return top element",                  // 5
    "  return stack_list[-1]",                    // 6
    "  # (Top element is highlighted)",           // 7
  ],
};

// --- Operation Modal (Simplified for Stack) ---
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

  const needsValue = operation === 'push'; // Only push needs a value

  const handleSubmit = () => {
    setModalError('');
    if (needsValue && !modalValue.trim()) {
      setModalError('Value cannot be empty for Push operation.');
      return;
    }
    onSubmit({ value: modalValue });
  };

  const getOperationName = (op: Operation) => {
    if (op === 'push') return 'Push Value onto Stack';
    // Pop and Peek don't use this modal for input, but we can keep it for consistency if ever needed
    if (op === 'pop') return 'Pop Value from Stack';
    if (op === 'peek') return 'Peek Value from Stack';
    return 'Stack Operation';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-sky-400">{getOperationName(operation)}</h2>
        {modalError && <p className="text-red-400 text-sm mb-3">{modalError}</p>}
        {needsValue && (
          <div className="mb-4">
            <label htmlFor="modalValue" className="block text-sm font-medium text-gray-300 mb-1">Value to Push:</label>
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


// --- Main Stack Visualizer Component ---
const StackOperationsVisualizer: React.FC = () => {
  const [stack, setStack] = useState<StackElement[]>([]);
  const [message, setMessage] = useState<string>('Choose a stack operation.');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null); // To highlight top for peek
  const [poppedValue, setPoppedValue] = useState<string | number | null>(null);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperationForModal, setCurrentOperationForModal] = useState<Operation | null>(null);
  const [activeOperationType, setActiveOperationType] = useState<Operation | null>(null);

  const [codeLanguageMode, setCodeLanguageMode] = useState<'c' | 'python'>('c');
  const [currentOperationCode, setCurrentOperationCode] = useState<string[]>(C_CODE_MAP.idle);
  const [currentCodeLineHighlights, setCurrentCodeLineHighlights] = useState<number[]>([]);
  const [programStateView, setProgramStateView] = useState<Record<string, string | number | null | undefined>>({
    top: -1,
    capacity: MAX_STACK_SIZE,
    current_size: 0,
  });

  const [operationSteps, setOperationSteps] = useState<Array<() => Promise<void> | void>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [isStepExecuting, setIsStepExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'idle' | 'step' | 'auto' | 'paused'>('idle');

  const elementsContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // Initial Stack (Optional)
  useEffect(() => {
    const initialData: StackElement[] = [
      { id: generateId(), value: 10 }, { id: generateId(), value: 20 },
    ];
    setStack(initialData);
    setMessage('Default stack loaded. Choose an operation.');
    setProgramStateView({ top: initialData.length -1, capacity: MAX_STACK_SIZE, current_size: initialData.length, status: "Initial Stack" });


    setTimeout(() => {
      initialData.forEach((item, index) => {
        const el = elementsRef.current.get(item.id);
        if (el) {
          gsap.set(el, { opacity: 0, scale: 0.3, y: -30 }); // Animate from top
          gsap.to(el, {
            opacity: 1, scale: 1, y: 0, duration: ANIMATION_DURATION * 1.5,
            delay: index * 0.1, ease: 'elastic.out(1, 0.75)',
          });
        }
      });
    }, 100);
  }, []);

  // --- Animation Functions ---
  const animateElementIn = (elementId: string, isPush: boolean = true, delay: number = 0) => {
    const el = elementsRef.current.get(elementId);
    if (el) {
      // For push, elements come from "outside" (e.g., above or from the right if horizontal)
      // For simplicity, let's use a y-offset to simulate coming from above
      gsap.set(el, { opacity: 0, scale: 0.7, y: -ELEMENT_HEIGHT_PX/2, x: isPush ? ELEMENT_WIDTH_PX/2 : 0 });
      gsap.to(el, {
        opacity: 1, scale: 1, y: 0, x:0,
        duration: ANIMATION_DURATION, delay, ease: 'back.out(1.7)'
      });
    }
  };

  const animateElementOut = async (elementId: string, isPop: boolean = true) => {
    const el = elementsRef.current.get(elementId);
    if (el) {
      await gsap.to(el, {
        opacity: 0, scale: 0.7, y: -ELEMENT_HEIGHT_PX/2, x: isPop ? ELEMENT_WIDTH_PX/2 : 0,
        duration: ANIMATION_DURATION, ease: 'power2.in'
      }).then();
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
    setHighlightedIndex(null); // Clear peek highlight
    setPoppedValue(null);
    if (statusMessage) {
      setMessage(statusMessage);
    } else {
      setMessage(prev => prev.includes("...") ? prev.replace("...", " completed.") : `${activeOperationType || 'Operation'} finished.`);
    }
    setProgramStateView(prev => ({ ...prev, status: statusMessage || "Completed", popped_value: undefined, peeked_value: undefined }));
  }, [activeOperationType]);


  const prepareOperation = useCallback(async (op: Operation, details: { value?: string }) => {
    if (isOperationActive && executionMode === 'auto') {
      setMessage("Operation in auto mode. Please pause or wait.");
      return;
    }
    setPoppedValue(null);
    setIsStepExecuting(false);
    setHighlightedIndex(null);

    const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
    setCurrentOperationCode(mapToUse[op] || mapToUse.idle);
    setCurrentCodeLineHighlights([0]);
    setMessage(`Preparing to ${op}...`);

    const currentStackSize = stack.length;
    // const stackSnapshotAtPrep = [...stack.map(item => ({...item}))];

    const initialProgramState: Record<string, any> = {
      operation: op,
      language: codeLanguageMode,
      status: "Preparing...",
      top: currentStackSize -1,
      current_size: currentStackSize,
      capacity: MAX_STACK_SIZE,
    };
     if (op === 'push') {
      initialProgramState.value_to_push = details.value?.trim() || '';
    }
    setProgramStateView(initialProgramState);

    const val = details.value?.trim() || '';
    let tempNewItemId: string | null = null;
    let steps: Array<() => Promise<void> | void> = [];

    // --- PUSH Operation Steps ---
    if (op === 'push') {
      steps.push(async () => { // 1. Validate (Stack Overflow)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for push: Is stack full?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking capacity..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentStackSize >= MAX_STACK_SIZE) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Stack Overflow! Cannot push (max ${MAX_STACK_SIZE} items).`;
          setProgramStateView(prev => ({ ...prev, status: "Error: Stack Overflow" }));
          return Promise.reject(errorMsg);
        }
        setProgramStateView(prev => ({ ...prev, status: "Validation OK: Stack has space" }));
      });

      steps.push(async () => { // 2. Perform Push: Increment top (C) & Add element
        const cLines = [6,7,8,9,10];
        const pyLines = [5,6,7];
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Pushing ${val} onto the stack...`);
        const newTop = currentStackSize; // top will be new index
        setProgramStateView(prev => ({ ...prev, status: `Logically adding ${val}, top becomes ${newTop}`, top: newTop, value_being_pushed: val }));

        const newItem: StackElement = { id: generateId(), value: val };
        tempNewItemId = newItem.id;

        setStack(prevStack => [...prevStack, newItem]); // Add to React state

        await new Promise(resolve => setTimeout(() => { // Ensure DOM update
          if (tempNewItemId) animateElementIn(tempNewItemId, true);
          resolve(true);
        }, 50)); // Short delay for DOM to update
         await new Promise(r => setTimeout(r, ANIMATION_DURATION * 1000 + 50));
      });

      steps.push(async () => { // 3. Update Size & Finish
         const cLines = [11];
         const pyLines = [8];
         setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Push operation for ${val} complete.`);
        const newSize = currentStackSize + 1;
        setProgramStateView(prev => ({ ...prev, status: "Push complete", current_size: newSize, value_being_pushed: undefined }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });
    }
    // --- POP Operation Steps ---
    else if (op === 'pop') {
      let poppedItemValue: string | number | undefined = undefined;

      steps.push(async () => { // 1. Validate (Stack Underflow)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for pop: Is stack empty?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking if stack is empty..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentStackSize === 0) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Stack Underflow! Cannot pop from an empty stack.`;
          setProgramStateView(prev => ({ ...prev, status: "Error: Stack Underflow" }));
          return Promise.reject(errorMsg);
        }
        setProgramStateView(prev => ({ ...prev, status: "Validation OK: Stack is not empty" }));
      });

      steps.push(async () => { // 2. Get top element and Animate Out
        const cLines = [6,7,10]; // Get item, (animate), then later decrement top
        const pyLines = [5,6,7]; // Pop and animate
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        const itemToPop = stack[currentStackSize - 1];
        poppedItemValue = itemToPop.value;
        setPoppedValue(poppedItemValue); // For display during animation

        setMessage(`Popping ${poppedItemValue} from the stack...`);
        setProgramStateView(prev => ({ ...prev, status: `Animating pop of ${poppedItemValue}`, value_being_popped: poppedItemValue }));
        setHighlightedIndex(currentStackSize - 1); // Highlight element being popped

        await animateElementOut(itemToPop.id, true);
        setHighlightedIndex(null);
      });

      steps.push(async () => { // 3. Update State (Decrement top & remove from array)
        const cLines = [8,9,11,12];
        const pyLines = [8];
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        setMessage(`Element ${poppedItemValue} popped.`);
        const newTop = currentStackSize - 2; // top index after pop
        const newSize = currentStackSize - 1;

        setStack(prevStack => prevStack.slice(0, -1)); // Actually remove from React state

        setProgramStateView(prev => ({
            ...prev,
            status: "Pop complete",
            top: newTop,
            current_size: newSize,
            popped_value: poppedItemValue,
            value_being_popped: undefined
        }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });
    }
    // --- PEEK Operation Steps ---
    else if (op === 'peek') {
      steps.push(async () => { // 1. Validate (Stack Empty)
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2] : [1, 2]);
        setMessage(`Validating for peek: Is stack empty?`);
        setProgramStateView(prev => ({ ...prev, status: "Checking if stack is empty..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        if (currentStackSize === 0) {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1, 2, 3, 4] : [1, 2, 3, 4]);
          const errorMsg = `Stack is Empty! Cannot peek.`;
           setProgramStateView(prev => ({ ...prev, status: "Error: Stack Empty" }));
          return Promise.reject(errorMsg);
        }
         setProgramStateView(prev => ({ ...prev, status: "Validation OK: Stack is not empty" }));
      });

      steps.push(async () => { // 2. Highlight and show top element
        const cLines = [6,7,8,9];
        const pyLines = [5,6,7];
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? cLines : pyLines);
        const topItem = stack[currentStackSize - 1];
        setMessage(`Peeking at top element: ${topItem.value}.`);
        setProgramStateView(prev => ({ ...prev, status: `Peeking at ${topItem.value}`, peeked_value: topItem.value }));
        setHighlightedIndex(currentStackSize - 1); // Highlight top element
        // Simple visual cue: slightly scale up and change border for the highlighted element
        const el = elementsRef.current.get(topItem.id);
        if (el) {
            gsap.to(el, { scale: 1.1, duration: ANIMATION_DURATION/2, yoyo: true, repeat: 1, ease: "power1.inOut" });
        }
        await new Promise(r => setTimeout(r, STEP_DELAY_MS + ANIMATION_DURATION * 1000)); // Hold highlight
      });

       steps.push(async () => { // 3. Finish Peek
        setMessage(`Peek operation complete.`);
        setProgramStateView(prev => ({ ...prev, status: "Peek complete"}));
        // Highlight will be removed by finishOperation
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
  }, [stack, codeLanguageMode, executionMode, isOperationActive]); // Added stack dependencies

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
    setPoppedValue(null);
    setActiveOperationType(op);
    setCurrentCodeLineHighlights([]);
    setIsOperationActive(false);
    setCurrentStepIndex(0);
    setOperationSteps([]);
    setExecutionMode('step'); // Default to step-by-step
    setProgramStateView(prev => ({ ...prev, operation: op, language: codeLanguageMode, status: "Waiting for input...", popped_value: undefined, peeked_value: undefined }));


    if (op === 'push') {
      setCurrentOperationForModal(op);
      setIsModalOpen(true);
    } else if (op === 'pop' || op === 'peek') {
      // Pop and Peek don't need modal input, prepare them directly
      prepareOperation(op, {}); // Empty details object
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
    setProgramStateView(prev => ({...prev, note: "Operation cancelled.", status: "Cancelled" }));
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
        // Double check conditions before running, as state might change rapidly
        if (executionMode === 'auto' && isOperationActive && !isStepExecuting && currentStepIndex < operationSteps.length) {
            runNextStep();
        }
      }, STEP_DELAY_MS);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [executionMode, runNextStep, isOperationActive, isStepExecuting, currentStepIndex, operationSteps.length]);


  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 p-4 text-white pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Stack Operations Visualizer 🥞</h1>
       {poppedValue !== null && (
        <p className="text-xl text-orange-400 mb-4">Popped: {poppedValue}</p>
      )}

      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
        {/* Left Panel: Controls, Visualization, Program State */}
        <div className="flex-grow lg:w-[65%] flex flex-col gap-4">
          {/* Operation Buttons */}
          <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => triggerOperation('push')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-green-600 hover:bg-green-500">Push</button>
              <button onClick={() => triggerOperation('pop')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-red-600 hover:bg-red-500">Pop</button>
              <button onClick={() => triggerOperation('peek')} disabled={isStepExecuting || (isOperationActive && executionMode === 'auto')} className="btn-op bg-blue-600 hover:bg-blue-500">Peek</button>
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

        {/* Stack Visualization (Horizontal for simplicity, top on the right) */}
          <div className="w-full min-h-[100px] bg-gray-800/60 p-4 rounded-lg border-2 border-gray-700 flex items-end justify-start shadow-inner relative overflow-hidden"
               style={{ flexDirection: 'row', minHeight: `${ELEMENT_HEIGHT_PX + 40}px`}} // Ensure enough height
          >
            <div ref={elementsContainerRef} className="flex flex-row-reverse items-end h-full relative"> {/* flex-row-reverse for visual "top on left" */}
              {stack.slice().reverse().map((item, visualIndex) => { // Iterate reversed for visual layout
                const actualIndex = stack.length - 1 - visualIndex; // actual index in stack array
                const isTop = actualIndex === stack.length - 1;
                return (
                  <div key={item.id} className="flex flex-col items-center mx-1 relative"> {/* mx-1 for spacing, relative for TOP positioning */}
                    {isTop && stack.length > 0 && (
                      <div className="text-xs text-amber-400 mb-1 absolute -top-4 transform -translate-x-1/2 left-1/2 px-1 bg-gray-900 rounded">TOP</div>
                    )}
                    <div
                      ref={el => { elementsRef.current.set(item.id, el); }}
                      className={`flex items-center justify-center rounded-md text-xl font-bold transition-all duration-200
                                  border-t-2 border-l-2 border-r-2 border-b-4
                                  ${highlightedIndex === actualIndex
                                    ? 'border-yellow-300 border-b-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 scale-105 shadow-2xl brightness-125'
                                    : 'border-sky-400 border-b-sky-700 bg-gradient-to-br from-sky-500 to-sky-700 shadow-lg'}`}
                      style={{
                        opacity: 0, // Initial opacity for GSAP
                        width: `${ELEMENT_WIDTH_PX}px`,
                        height: `${ELEMENT_HEIGHT_PX}px`,
                        // marginRight: ELEMENT_SPACING_PX // For horizontal stack
                      }}
                    >
                      {item.value}
                    </div>
                     {/* No index display for stack elements usually */}
                  </div>
                );
            })}
            </div>
            {stack.length === 0 && (<p className="absolute inset-0 flex items-center justify-center text-gray-500 italic">Stack is empty.</p>)}
          </div>


          {/* Program State Panel */}
          <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl mt-4">
            <h3 className="text-lg font-semibold text-sky-400 mb-2 border-b border-gray-700 pb-1">Program State</h3>
            {Object.keys(programStateView).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(programStateView).map(([key, value]) => (
                        <div key={key} className="flex">
                            <span className="font-medium text-gray-400 mr-2 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-yellow-300">{String(value === undefined ? "N/A" : value)}</span>
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
        Stack Operations Visualizer | Next.js, TypeScript, GSAP, Tailwind CSS
      </p>
    </div>
  );
};

export default StackOperationsVisualizer;