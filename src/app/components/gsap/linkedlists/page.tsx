// components/LinkedListOperationsVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

// --- Constants ---
const MAX_LIST_SIZE = 8;
const ANIMATION_DURATION = 0.5; // seconds
const STEP_DELAY_MS = 500; // Delay between automatic steps
const NODE_WIDTH_PX = 80;
const NODE_HEIGHT_PX = 60;
const NODE_SPACING_PX = 100;
const POINTER_WIDTH_PX = 40;

// --- Interfaces and Types ---
interface ListNode {
  id: string;
  value: string | number;
  next: string | null; // reference to next node's ID
}

type Operation =
  | 'idle'
  | 'insertAtHead'
  | 'insertAtTail'
  | 'insertAtPosition'
  | 'deleteAtHead'
  | 'deleteAtTail'
  | 'deleteAtPosition'
  | 'search'
  | 'traverse';

interface ModalProps {
  isOpen: boolean;
  operation: Operation | null;
  onClose: () => void;
  onSubmit: (details: { value?: string; position?: string }) => void;
}

// --- C Language Code Definitions (Linked List) ---
const C_CODE_MAP: Record<Operation | 'idle' | 'is_empty', string[]> = {
  idle: ["// Select a linked list operation to see the C code."],
  is_empty: [
    "int isEmpty(Node* head) {",
    "  return head == NULL;",
    "}"
  ],
  insertAtHead: [
    "// Insert at head of linked list",               // 0
    "void insertAtHead(Node** head, int value) {",    // 1
    "  // 1. Create new node",                        // 2
    "  Node* newNode = malloc(sizeof(Node));",        // 3
    "  newNode->data = value;",                       // 4
    "  // 2. Set new node's next to current head",    // 5
    "  newNode->next = *head;",                      // 6
    "  // 3. Update head pointer",                    // 7
    "  *head = newNode;",                             // 8
    "  // (Visual: new node appears at head)",        // 9
    "}",                                              // 10
  ],
  insertAtTail: [
    "// Insert at tail of linked list",               // 0
    "void insertAtTail(Node** head, int value) {",    // 1
    "  // 1. Create new node",                        // 2
    "  Node* newNode = malloc(sizeof(Node));",        // 3
    "  newNode->data = value;",                       // 4
    "  newNode->next = NULL;",                        // 5
    "  // 2. If list is empty, set as head",          // 6
    "  if (*head == NULL) {",                         // 7
    "    *head = newNode;",                           // 8
    "    return;",                                    // 9
    "  }",                                            // 10
    "  // 3. Traverse to last node",                  // 11
    "  Node* current = *head;",                       // 12
    "  while (current->next != NULL) {",              // 13
    "    current = current->next;",                   // 14
    "  }",                                            // 15
    "  // 4. Set last node's next to new node",       // 16
    "  current->next = newNode;",                     // 17
    "  // (Visual: new node appears at tail)",        // 18
    "}",                                              // 19
  ],
  insertAtPosition: [
    "// Insert at specific position in linked list",  // 0
    "void insertAtPosition(Node** head, int value, int pos) {", // 1
    "  // 1. Check if position is 0 (insert at head)", // 2
    "  if (pos == 0) {",                              // 3
    "    insertAtHead(head, value);",                 // 4
    "    return;",                                    // 5
    "  }",                                            // 6
    "  // 2. Create new node",                        // 7
    "  Node* newNode = malloc(sizeof(Node));",        // 8
    "  newNode->data = value;",                       // 9
    "  // 3. Traverse to node before position",       // 10
    "  Node* current = *head;",                       // 11
    "  for (int i = 0; current != NULL && i < pos-1; i++) {", // 12
    "    current = current->next;",                   // 13
    "  }",                                            // 14
    "  // 4. Check if position is valid",             // 15
    "  if (current == NULL) {",                       // 16
    "    printf(\"Position out of bounds!\\n\");",     // 17
    "    return;",                                    // 18
    "  }",                                            // 19
    "  // 5. Insert new node",                        // 20
    "  newNode->next = current->next;",               // 21
    "  current->next = newNode;",                     // 22
    "  // (Visual: new node appears at position)",    // 23
    "}",                                              // 24
  ],
  deleteAtHead: [
    "// Delete head node of linked list",             // 0
    "void deleteAtHead(Node** head) {",               // 1
    "  // 1. Check if list is empty",                 // 2
    "  if (*head == NULL) {",                         // 3
    "    printf(\"List is empty!\\n\");",              // 4
    "    return;",                                    // 5
    "  }",                                            // 6
    "  // 2. Store head node to free later",          // 7
    "  Node* temp = *head;",                          // 8
    "  // 3. Update head pointer",                    // 9
    "  *head = (*head)->next;",                       // 10
    "  // 4. Free memory",                            // 11
    "  free(temp);",                                  // 12
    "  // (Visual: head node disappears)",            // 13
    "}",                                              // 14
  ],
  deleteAtTail: [
    "// Delete tail node of linked list",             // 0
    "void deleteAtTail(Node** head) {",               // 1
    "  // 1. Check if list is empty",                 // 2
    "  if (*head == NULL) {",                         // 3
    "    printf(\"List is empty!\\n\");",              // 4
    "    return;",                                    // 5
    "  }",                                            // 6
    "  // 2. If only one node, delete it",            // 7
    "  if ((*head)->next == NULL) {",                 // 8
    "    free(*head);",                               // 9
    "    *head = NULL;",                              // 10
    "    return;",                                    // 11
    "  }",                                            // 12
    "  // 3. Traverse to second last node",           // 13
    "  Node* current = *head;",                       // 14
    "  while (current->next->next != NULL) {",        // 15
    "    current = current->next;",                   // 16
    "  }",                                            // 17
    "  // 4. Delete last node",                       // 18
    "  free(current->next);",                         // 19
    "  current->next = NULL;",                        // 20
    "  // (Visual: tail node disappears)",            // 21
    "}",                                              // 22
  ],
  deleteAtPosition: [
    "// Delete node at specific position",           // 0
    "void deleteAtPosition(Node** head, int pos) {",  // 1
    "  // 1. Check if list is empty",                 // 2
    "  if (*head == NULL) {",                         // 3
    "    printf(\"List is empty!\\n\");",              // 4
    "    return;",                                    // 5
    "  }",                                            // 6
    "  // 2. If position is 0, delete head",          // 7
    "  if (pos == 0) {",                              // 8
    "    deleteAtHead(head);",                        // 9
    "    return;",                                    // 10
    "  }",                                            // 11
    "  // 3. Traverse to node before position",       // 12
    "  Node* current = *head;",                       // 13
    "  for (int i = 0; current != NULL && i < pos-1; i++) {", // 14
    "    current = current->next;",                   // 15
    "  }",                                            // 16
    "  // 4. Check if position is valid",             // 17
    "  if (current == NULL || current->next == NULL) {", // 18
    "    printf(\"Position out of bounds!\\n\");",     // 19
    "    return;",                                    // 20
    "  }",                                            // 21
    "  // 5. Delete node at position",                // 22
    "  Node* temp = current->next;",                  // 23
    "  current->next = temp->next;",                  // 24
    "  free(temp);",                                  // 25
    "  // (Visual: node at position disappears)",     // 26
    "}",                                              // 27
  ],
  search: [
    "// Search for value in linked list",             // 0
    "int search(Node* head, int value) {",            // 1
    "  Node* current = head;",                        // 2
    "  int position = 0;",                            // 3
    "  while (current != NULL) {",                    // 4
    "    if (current->data == value) {",              // 5
    "      return position;",                         // 6
    "    }",                                          // 7
    "    current = current->next;",                   // 8
    "    position++;",                                // 9
    "  }",                                            // 10
    "  return -1; // Not found",                      // 11
    "}",                                              // 12
  ],
  traverse: [
    "// Traverse and print linked list",              // 0
    "void traverse(Node* head) {",                    // 1
    "  Node* current = head;",                        // 2
    "  while (current != NULL) {",                    // 3
    "    printf(\"%d \", current->data);",             // 4
    "    current = current->next;",                   // 5
    "  }",                                            // 6
    "  printf(\"\\n\");",                              // 7
    "}",                                              // 8
  ]
};

// --- Python Code Definitions (Linked List) ---
const PYTHON_CODE_MAP: Record<Operation | 'idle' | 'is_empty', string[]> = {
  idle: ["# Select a linked list operation to see the Python code."],
  is_empty: [
    "def is_empty(head):",
    "  return head is None"
  ],
  insertAtHead: [
    "# Insert at head of linked list",                // 0
    "def insert_at_head(head, value):",               // 1
    "  # 1. Create new node",                         // 2
    "  new_node = Node(value)",                       // 3
    "  # 2. Set new node's next to current head",     // 4
    "  new_node.next = head",                         // 5
    "  # 3. Update head pointer",                     // 6
    "  head = new_node",                              // 7
    "  # (Visual: new node appears at head)",         // 8
    "  return head",                                  // 9
  ],
  insertAtTail: [
    "# Insert at tail of linked list",                // 0
    "def insert_at_tail(head, value):",               // 1
    "  # 1. Create new node",                         // 2
    "  new_node = Node(value)",                       // 3
    "  # 2. If list is empty, set as head",           // 4
    "  if head is None:",                             // 5
    "    head = new_node",                            // 6
    "    return head",                                // 7
    "  # 3. Traverse to last node",                   // 8
    "  current = head",                               // 9
    "  while current.next is not None:",              // 10
    "    current = current.next",                     // 11
    "  # 4. Set last node's next to new node",        // 12
    "  current.next = new_node",                      // 13
    "  # (Visual: new node appears at tail)",         // 14
    "  return head",                                  // 15
  ],
  insertAtPosition: [
    "# Insert at specific position in linked list",   // 0
    "def insert_at_position(head, value, pos):",      // 1
    "  # 1. Check if position is 0 (insert at head)", // 2
    "  if pos == 0:",                                 // 3
    "    return insert_at_head(head, value)",         // 4
    "  # 2. Create new node",                         // 5
    "  new_node = Node(value)",                       // 6
    "  # 3. Traverse to node before position",        // 7
    "  current = head",                               // 8
    "  for _ in range(pos - 1):",                     // 9
    "    if current is None:",                        // 10
    "      print(\"Position out of bounds!\")",        // 11
    "      return head",                              // 12
    "    current = current.next",                     // 13
    "  # 4. Check if position is valid",              // 14
    "  if current is None:",                          // 15
    "    print(\"Position out of bounds!\")",          // 16
    "    return head",                                // 17
    "  # 5. Insert new node",                         // 18
    "  new_node.next = current.next",                 // 19
    "  current.next = new_node",                      // 20
    "  # (Visual: new node appears at position)",     // 21
    "  return head",                                  // 22
  ],
  deleteAtHead: [
    "# Delete head node of linked list",              // 0
    "def delete_at_head(head):",                      // 1
    "  # 1. Check if list is empty",                  // 2
    "  if head is None:",                             // 3
    "    print(\"List is empty!\")",                   // 4
    "    return head",                                // 5
    "  # 2. Update head pointer",                     // 6
    "  head = head.next",                             // 7
    "  # (Visual: head node disappears)",             // 8
    "  return head",                                  // 9
  ],
  deleteAtTail: [
    "# Delete tail node of linked list",              // 0
    "def delete_at_tail(head):",                      // 1
    "  # 1. Check if list is empty",                  // 2
    "  if head is None:",                             // 3
    "    print(\"List is empty!\")",                   // 4
    "    return head",                                // 5
    "  # 2. If only one node, delete it",             // 6
    "  if head.next is None:",                        // 7
    "    head = None",                                // 8
    "    return head",                                // 9
    "  # 3. Traverse to second last node",            // 10
    "  current = head",                               // 11
    "  while current.next.next is not None:",         // 12
    "    current = current.next",                     // 13
    "  # 4. Delete last node",                        // 14
    "  current.next = None",                          // 15
    "  # (Visual: tail node disappears)",             // 16
    "  return head",                                  // 17
  ],
  deleteAtPosition: [
    "# Delete node at specific position",             // 0
    "def delete_at_position(head, pos):",             // 1
    "  # 1. Check if list is empty",                  // 2
    "  if head is None:",                             // 3
    "    print(\"List is empty!\")",                   // 4
    "    return head",                                // 5
    "  # 2. If position is 0, delete head",           // 6
    "  if pos == 0:",                                 // 7
    "    return delete_at_head(head)",                // 8
    "  # 3. Traverse to node before position",        // 9
    "  current = head",                               // 10
    "  for _ in range(pos - 1):",                     // 11
    "    if current is None or current.next is None:", // 12
    "      print(\"Position out of bounds!\")",        // 13
    "      return head",                              // 14
    "    current = current.next",                     // 15
    "  # 4. Check if position is valid",              // 16
    "  if current.next is None:",                     // 17
    "    print(\"Position out of bounds!\")",          // 18
    "    return head",                                // 19
    "  # 5. Delete node at position",                 // 20
    "  current.next = current.next.next",             // 21
    "  # (Visual: node at position disappears)",      // 22
    "  return head",                                  // 23
  ],
  search: [
    "# Search for value in linked list",              // 0
    "def search(head, value):",                       // 1
    "  current = head",                               // 2
    "  position = 0",                                 // 3
    "  while current is not None:",                   // 4
    "    if current.data == value:",                  // 5
    "      return position",                          // 6
    "    current = current.next",                     // 7
    "    position += 1",                              // 8
    "  return -1 # Not found",                        // 9
  ],
  traverse: [
    "# Traverse and print linked list",               // 0
    "def traverse(head):",                            // 1
    "  current = head",                               // 2
    "  while current is not None:",                   // 3
    "    print(current.data, end=' ')",               // 4
    "    current = current.next",                     // 5
    "  print()",                                      // 6
  ]
};

// --- Operation Modal ---
const OperationModal: React.FC<ModalProps> = ({ isOpen, operation, onClose, onSubmit }) => {
  const [modalValue, setModalValue] = useState('');
  const [modalPosition, setModalPosition] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModalValue('');
      setModalPosition('');
      setModalError('');
    }
  }, [isOpen]);

  if (!isOpen || !operation) return null;

  const needsValue = ['insertAtHead', 'insertAtTail', 'insertAtPosition', 'search'].includes(operation);
  const needsPosition = ['insertAtPosition', 'deleteAtPosition'].includes(operation);

  const handleSubmit = () => {
    setModalError('');
    
    if (needsValue && !modalValue.trim()) {
      setModalError('Value cannot be empty.');
      return;
    }
    
    if (needsPosition && !modalPosition.trim()) {
      setModalError('Position cannot be empty.');
      return;
    }
    
    if (needsPosition && isNaN(Number(modalPosition))) {
      setModalError('Position must be a number.');
      return;
    }
    
    if (needsPosition && Number(modalPosition) < 0) {
      setModalError('Position cannot be negative.');
      return;
    }

    onSubmit({ 
      value: needsValue ? modalValue : undefined,
      position: needsPosition ? modalPosition : undefined
    });
  };

  const getOperationName = (op: Operation) => {
    const names: Record<Exclude<Operation, 'idle'>, string> = {
      'insertAtHead': 'Insert at Head',
      'insertAtTail': 'Insert at Tail',
      'insertAtPosition': 'Insert at Position',
      'deleteAtHead': 'Delete at Head',
      'deleteAtTail': 'Delete at Tail',
      'deleteAtPosition': 'Delete at Position',
      'search': 'Search for Value',
      'traverse': 'Traverse List'
    };
    return (op in names ? names[op as Exclude<Operation, 'idle'>] : 'Linked List Operation');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-sky-400">{getOperationName(operation)}</h2>
        {modalError && <p className="text-red-400 text-sm mb-3">{modalError}</p>}
        
        {needsValue && (
          <div className="mb-4">
            <label htmlFor="modalValue" className="block text-sm font-medium text-gray-300 mb-1">
              {operation === 'search' ? 'Value to search:' : 'Value to insert:'}
            </label>
            <input
              type="text" id="modalValue" value={modalValue} onChange={(e) => setModalValue(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-sky-500" autoFocus
            />
          </div>
        )}
        
        {needsPosition && (
          <div className="mb-4">
            <label htmlFor="modalPosition" className="block text-sm font-medium text-gray-300 mb-1">
              Position (0-based index):
            </label>
            <input
              type="number" id="modalPosition" value={modalPosition} onChange={(e) => setModalPosition(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-sky-500"
              min="0"
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

// --- Main Linked List Visualizer Component ---
const LinkedListOperationsVisualizer: React.FC = () => {
  const [list, setList] = useState<ListNode[]>([]);
  const [headId, setHeadId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Choose a linked list operation.');
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [resultValue, setResultValue] = useState<string | number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperationForModal, setCurrentOperationForModal] = useState<Operation | null>(null);
  const [activeOperationType, setActiveOperationType] = useState<Operation | null>(null);

  const [codeLanguageMode, setCodeLanguageMode] = useState<'c' | 'python'>('c');
  const [currentOperationCode, setCurrentOperationCode] = useState<string[]>(C_CODE_MAP.idle);
  const [currentCodeLineHighlights, setCurrentCodeLineHighlights] = useState<number[]>([]);
  const [programStateView, setProgramStateView] = useState<Record<string, string | number | null | undefined>>({
    head: null,
    current_size: 0,
    current_node: null,
    current_node_value: null,
    current_position: null,
    search_result: null,
  });

  const [operationSteps, setOperationSteps] = useState<Array<() => Promise<void> | void>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [isStepExecuting, setIsStepExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'idle' | 'step' | 'auto' | 'paused'>('idle');

  const elementsContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const arrowsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initial List (Optional)
  useEffect(() => {
    const initialData: ListNode[] = [
      { id: generateId(), value: 10, next: null },
      { id: generateId(), value: 20, next: null },
      { id: generateId(), value: 30, next: null },
    ];
    
    // Set up next pointers
    for (let i = 0; i < initialData.length - 1; i++) {
      initialData[i].next = initialData[i + 1].id;
    }
    
    setList(initialData);
    setHeadId(initialData.length > 0 ? initialData[0].id : null);
    setMessage('Default linked list loaded. Choose an operation.');
    setProgramStateView({
      head: initialData.length > 0 ? initialData[0].id : null,
      current_size: initialData.length,
      current_node: null,
      current_node_value: null,
      current_position: null,
      search_result: null,
      status: "Initial Linked List"
    });

    setTimeout(() => {
      initialData.forEach((item, index) => {
        const el = elementsRef.current.get(item.id);
        if (el) {
          gsap.set(el, { opacity: 0, scale: 0.3, x: 30 });
          gsap.to(el, {
            opacity: 1, scale: 1, x: 0, duration: ANIMATION_DURATION * 1.5,
            delay: index * 0.1, ease: 'elastic.out(1, 0.75)',
          });
        }
      });
    }, 100);
  }, []);

  // --- Animation Functions ---
  const animateNodeIn = (nodeId: string, delay: number = 0) => {
    const el = elementsRef.current.get(nodeId);
    if (el) {
      gsap.set(el, { opacity: 0, scale: 0.7, x: NODE_WIDTH_PX / 2 });
      gsap.to(el, {
        opacity: 1, scale: 1, x: 0,
        duration: ANIMATION_DURATION, delay, ease: 'back.out(1.7)'
      });
    }
  };

  const animateNodeOut = async (nodeId: string) => {
    const el = elementsRef.current.get(nodeId);
    if (el) {
      await gsap.to(el, {
        opacity: 0, scale: 0.7, x: -NODE_WIDTH_PX / 1.5,
        duration: ANIMATION_DURATION, ease: 'power2.in'
      }).then();
    }
  };

  const animateArrow = async (fromId: string, toId: string | null) => {
    const arrowId = `arrow-${fromId}`;
    const arrowEl = arrowsRef.current.get(arrowId);
    
    if (!arrowEl) return;
    
    if (toId) {
      // Animate arrow pointing to next node
      const toEl = elementsRef.current.get(toId);
      if (!toEl) return;
      
      const fromRect = arrowEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      
      const angle = Math.atan2(
        toRect.top + toRect.height/2 - (fromRect.top + fromRect.height/2),
        toRect.left + toRect.width/2 - (fromRect.left + fromRect.width/2)
      ) * 180 / Math.PI;
      
      const distance = Math.sqrt(
        Math.pow(toRect.left + toRect.width/2 - (fromRect.left + fromRect.width/2), 2) +
        Math.pow(toRect.top + toRect.height/2 - (fromRect.top + fromRect.height/2), 2)
      );
      
      gsap.to(arrowEl, {
        rotation: angle,
        width: distance,
        duration: ANIMATION_DURATION,
        ease: 'power2.out'
      });
    } else {
      // Animate arrow disappearing (for NULL pointer)
      gsap.to(arrowEl, {
        opacity: 0,
        duration: ANIMATION_DURATION / 2,
        ease: 'power2.in'
      });
    }
  };

  const highlightNode = async (nodeId: string | null) => {
    // Reset all highlights first
    list.forEach(node => {
      const el = elementsRef.current.get(node.id);
      if (el) {
        gsap.to(el, {
          backgroundColor: '#1E40AF', // Reset to default blue
          scale: 1,
          duration: ANIMATION_DURATION / 2,
          ease: 'power2.out'
        });
      }
    });
    
    if (nodeId) {
      const el = elementsRef.current.get(nodeId);
      if (el) {
        await gsap.to(el, {
          backgroundColor: '#F59E0B', // Highlight color
          scale: 1.1,
          duration: ANIMATION_DURATION / 2,
          ease: 'power2.out'
        }).then();
      }
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
    setHighlightedNodes([]);
    setCurrentNode(null);
    if (statusMessage) {
      setMessage(statusMessage);
    } else {
      setMessage(prev => prev.includes("...") ? prev.replace("...", " completed.") : `${activeOperationType || 'Operation'} finished.`);
    }
    setProgramStateView(prev => ({
      ...prev,
      status: statusMessage || "Completed",
      current_node: null,
      current_node_value: null,
      current_position: null,
    }));
  }, [activeOperationType]);

  const prepareOperation = useCallback(async (op: Operation, details: { value?: string; position?: string }) => {
    if (isOperationActive && executionMode === 'auto') {
      setMessage("Operation in auto mode. Please pause or wait.");
      return;
    }
    
    setResultValue(null);
    setIsStepExecuting(false);
    setHighlightedNodes([]);
    setCurrentNode(null);

    const mapToUse = codeLanguageMode === 'c' ? C_CODE_MAP : PYTHON_CODE_MAP;
    setCurrentOperationCode(mapToUse[op] || mapToUse.idle);
    setCurrentCodeLineHighlights([0]);
    setMessage(`Preparing to ${op}...`);

    const currentListSize = list.length;
    const val = details.value?.trim() || '';
    const pos = details.position ? parseInt(details.position) : -1;

    const initialProgramState: Record<string, any> = {
      operation: op,
      language: codeLanguageMode,
      status: "Preparing...",
      head: headId,
      current_size: currentListSize,
      current_node: null,
      current_node_value: null,
      current_position: null,
    };
    
    if (op === 'search') {
      initialProgramState.search_value = val;
    } else if (op === 'insertAtPosition' || op === 'deleteAtPosition') {
      initialProgramState.position = pos;
    } else if (
      (op as Operation) === 'insertAtHead' ||
      (op as Operation) === 'insertAtTail' ||
      (op as Operation) === 'insertAtPosition'
    ) {
      initialProgramState.value_to_insert = val;
    }
    
    setProgramStateView(initialProgramState);

    let tempNewNodeId: string | null = null;
    let steps: Array<() => Promise<void> | void> = [];

    // --- INSERT AT HEAD Operation Steps ---
    if (op === 'insertAtHead') {
      steps.push(async () => { // 1. Create new node
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4] : [2,3]);
        setMessage(`Creating new node with value ${val}...`);
        setProgramStateView(prev => ({ ...prev, status: "Creating new node..." }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        
        tempNewNodeId = generateId();
        const newNode: ListNode = { id: tempNewNodeId, value: val, next: headId };
        
        setProgramStateView(prev => ({
          ...prev,
          status: "New node created",
          new_node: tempNewNodeId,
          new_node_value: val
        }));
      });

      steps.push(async () => { // 2. Set new node's next to current head
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [5,6] : [4,5]);
        setMessage(`Setting new node's next pointer to current head...`);
        setProgramStateView(prev => ({ 
          ...prev, 
          status: "Setting next pointer...",
          new_node_next: headId
        }));
        
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        
        if (headId) {
          await animateArrow(tempNewNodeId!, headId);
        }
      });

      steps.push(async () => { // 3. Update head pointer
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [7,8] : [6,7]);
        setMessage(`Updating head pointer to new node...`);
        setProgramStateView(prev => ({ 
          ...prev, 
          status: "Updating head pointer...",
          head: tempNewNodeId
        }));
        
        setHeadId(tempNewNodeId);
        setList(prev => [{ id: tempNewNodeId!, value: val, next:         headId }, ...prev]);
        
        await animateNodeIn(tempNewNodeId!);
        await new Promise(r => setTimeout(r, STEP_DELAY_MS));
      });

      steps.push(() => { // 4. Operation complete
        setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 10 : 8]);
        setProgramStateView(prev => ({
          ...prev,
          status: "Insert at head completed",
          current_size: currentListSize + 1,
          new_node: null,
          new_node_value: null,
          new_node_next: null
        }));
        finishOperation(`Node with value ${val} inserted at head.`);
      });
    }

    // --- INSERT AT TAIL Operation Steps ---
    else if (op === 'insertAtTail') {
      if (currentListSize === 0) {
        // Special case: empty list (same as insert at head)
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [6,7,8] : [5,6,7]);
          setMessage(`List is empty - inserting as first node...`);
          setProgramStateView(prev => ({ ...prev, status: "Empty list - inserting as first node" }));
          
          tempNewNodeId = generateId();
          const newNode: ListNode = { id: tempNewNodeId, value: val, next: null };
          
          setHeadId(tempNewNodeId);
          setList([newNode]);
          
          await animateNodeIn(tempNewNodeId);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          setProgramStateView(prev => ({
            ...prev,
            status: "Insert at tail completed (empty list)",
            current_size: 1,
            head: tempNewNodeId
          }));
          finishOperation(`Node with value ${val} inserted at tail (first node).`);
        });
      } else {
        let currentPos = 0;
        let currentNodeId = headId;
        
        steps.push(async () => { // 1. Create new node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4,5] : [2,3]);
          setMessage(`Creating new node with value ${val}...`);
          setProgramStateView(prev => ({ ...prev, status: "Creating new node..." }));
          
          tempNewNodeId = generateId();
          const newNode: ListNode = { id: tempNewNodeId, value: val, next: null };
          
          setProgramStateView(prev => ({
            ...prev,
            status: "New node created",
            new_node: tempNewNodeId,
            new_node_value: val
          }));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        });

        steps.push(async () => { // 2. Traverse to last node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [11,12,13,14,15] : [8,9,10,11]);
          setMessage(`Traversing to the end of the list...`);
          
          while (currentNodeId) {
            const node = list.find(n => n.id === currentNodeId);
            if (!node) break;
            
            setCurrentNode(node.id);
            setProgramStateView(prev => ({
              ...prev,
              current_node: node.id,
              current_node_value: node.value,
              current_position: currentPos,
              status: `Traversing... Current at position ${currentPos}`
            }));
            
            await highlightNode(node.id);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            
            if (node.next) {
              currentNodeId = node.next;
              currentPos++;
            } else {
              break;
            }
          }
        });

        steps.push(async () => { // 3. Set last node's next to new node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [16,17] : [12,13]);
          setMessage(`Setting last node's next pointer to new node...`);
          setProgramStateView(prev => ({
            ...prev,
            status: "Linking new node to tail",
            new_node_next: null
          }));
          
          const updatedList = [...list];
          const lastNodeIndex = updatedList.findIndex(n => n.id === currentNodeId);
          if (lastNodeIndex !== -1) {
            updatedList[lastNodeIndex] = {
              ...updatedList[lastNodeIndex],
              next: tempNewNodeId
            };
            
            setList([...updatedList, { id: tempNewNodeId!, value: val, next: null }]);
            
            await animateArrow(currentNodeId!, tempNewNodeId!);
            await animateNodeIn(tempNewNodeId!);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          }
        });

        steps.push(() => { // 4. Operation complete
          setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 19 : 15]);
          setProgramStateView(prev => ({
            ...prev,
            status: "Insert at tail completed",
            current_size: currentListSize + 1,
            current_node: null,
            current_node_value: null,
            current_position: null,
            new_node: null,
            new_node_value: null
          }));
          finishOperation(`Node with value ${val} inserted at tail.`);
        });
      }
    }

    // --- INSERT AT POSITION Operation Steps ---
    else if (op === 'insertAtPosition') {
      if (pos === 0) {
        // Same as insert at head
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4] : [2,3,4]);
          setMessage(`Position 0 - inserting at head...`);
          
          tempNewNodeId = generateId();
          const newNode: ListNode = { id: tempNewNodeId, value: val, next: headId };
          
          setHeadId(tempNewNodeId);
          setList(prev => [newNode, ...prev]);
          
          await animateNodeIn(tempNewNodeId);
          if (headId) await animateArrow(tempNewNodeId, headId);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          setProgramStateView(prev => ({
            ...prev,
            status: "Insert at position 0 completed",
            current_size: currentListSize + 1,
            head: tempNewNodeId
          }));
          finishOperation(`Node with value ${val} inserted at position 0 (head).`);
        });
      } else {
        let currentPos = 0;
        let currentNodeId = headId;
        let prevNodeId: string | null = null;
        
        steps.push(async () => { // 1. Create new node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [7,8,9] : [5,6]);
          setMessage(`Creating new node with value ${val}...`);
          
          tempNewNodeId = generateId();
          setProgramStateView(prev => ({
            ...prev,
            status: "New node created",
            new_node: tempNewNodeId,
            new_node_value: val
          }));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        });

        steps.push(async () => { // 2. Traverse to position
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [10,11,12,13,14] : [8,9,10,11,12,13]);
          setMessage(`Traversing to position ${pos}...`);
          
          while (currentNodeId && currentPos < pos - 1) {
            const node = list.find(n => n.id === currentNodeId);
            if (!node) break;
            
            setCurrentNode(node.id);
            setProgramStateView(prev => ({
              ...prev,
              current_node: node.id,
              current_node_value: node.value,
              current_position: currentPos,
              status: `Traversing... Current at position ${currentPos}`
            }));
            
            await highlightNode(node.id);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            
            prevNodeId = currentNodeId;
            currentNodeId = node.next;
            currentPos++;
          }
        });

        steps.push(async () => { // 3. Check position validity
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [15,16,17,18,19] : [14,15,16,17]);
          setMessage(`Checking if position ${pos} is valid...`);
          
          const node = list.find(n => n.id === currentNodeId);
          if (!currentNodeId || !node) {
            setMessage(`Position ${pos} is out of bounds!`);
            setProgramStateView(prev => ({
              ...prev,
              status: `Error: Position ${pos} out of bounds`,
              current_node: null,
              current_node_value: null,
              current_position: null
            }));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            finishOperation(`Position ${pos} is out of bounds!`);
            return;
          }
        });

        steps.push(async () => { // 4. Insert new node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [20,21,22] : [18,19,20]);
          setMessage(`Inserting new node at position ${pos}...`);
          
          const node = list.find(n => n.id === currentNodeId);
          if (node) {
            const newNode: ListNode = { id: tempNewNodeId!, value: val, next: node.next };
            
            const updatedList = [...list];
            const prevNodeIndex = updatedList.findIndex(n => n.id === currentNodeId);
            if (prevNodeIndex !== -1) {
              updatedList.splice(prevNodeIndex + 1, 0, newNode);
              
              // Update previous node's next pointer
              updatedList[prevNodeIndex] = {
                ...updatedList[prevNodeIndex],
                next: tempNewNodeId
              };
              
              setList(updatedList);
              
              await animateArrow(String(currentNodeId), tempNewNodeId);
              if (node.next) await animateArrow(String(tempNewNodeId), node.next);
              await animateNodeIn(String(tempNewNodeId));
              await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            }
          }
        });

        steps.push(() => { // 5. Operation complete
          setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 24 : 22]);
          setProgramStateView(prev => ({
            ...prev,
            status: "Insert at position completed",
            current_size: currentListSize + 1,
            current_node: null,
            current_node_value: null,
            current_position: null,
            new_node: null,
            new_node_value: null
          }));
          finishOperation(`Node with value ${val} inserted at position ${pos}.`);
        });
      }
    }

    // --- DELETE AT HEAD Operation Steps ---
    else if (op === 'deleteAtHead') {
      if (currentListSize === 0) {
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4,5,6] : [2,3,4,5]);
          setMessage(`List is empty - nothing to delete!`);
          setProgramStateView(prev => ({
            ...prev,
            status: "Error: List is empty"
          }));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          finishOperation("List is empty - nothing to delete!");
        });
      } else {
        const nodeToDelete = list[0];
        
        steps.push(async () => { // 1. Check if list is empty (already handled)
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4,5,6] : [2,3,4,5]);
          setMessage(`Checking if list is empty...`);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
        });

        steps.push(async () => { // 2. Store head node to free later
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [7,8] : [6]);
          setMessage(`Preparing to delete head node with value ${nodeToDelete.value}...`);
          setProgramStateView(prev => ({
            ...prev,
            status: "Preparing to delete head",
            node_to_delete: nodeToDelete.id,
            node_to_delete_value: nodeToDelete.value
          }));
          await highlightNode(nodeToDelete.id);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        });

        steps.push(async () => { // 3. Update head pointer
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [9,10] : [7]);
          setMessage(`Updating head pointer to next node...`);
          
          const newHeadId = nodeToDelete.next;
          setHeadId(newHeadId);
          setList(prev => prev.slice(1));
          
          await animateNodeOut(nodeToDelete.id);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
        });

        steps.push(() => { // 4. Operation complete
          setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 14 : 9]);
          setProgramStateView(prev => ({
            ...prev,
            status: "Delete at head completed",
            current_size: currentListSize - 1,
            head: nodeToDelete.next,
            node_to_delete: null,
            node_to_delete_value: null
          }));
          finishOperation(`Head node with value ${nodeToDelete.value} deleted.`);
        });
      }
    }

    // --- DELETE AT TAIL Operation Steps ---
    else if (op === 'deleteAtTail') {
      if (currentListSize === 0) {
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4,5,6] : [2,3,4,5]);
          setMessage(`List is empty - nothing to delete!`);
          setProgramStateView(prev => ({
            ...prev,
            status: "Error: List is empty"
          }));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          finishOperation("List is empty - nothing to delete!");
        });
      } else if (currentListSize === 1) {
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [7,8,9,10,11,12] : [6,7,8,9]);
          setMessage(`Only one node - deleting it...`);
          
          const nodeToDelete = list[0];
          await highlightNode(nodeToDelete.id);
          await animateNodeOut(nodeToDelete.id);
          
          setHeadId(null);
          setList([]);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          setProgramStateView(prev => ({
            ...prev,
            status: "Delete at tail completed (only node)",
            current_size: 0,
            head: null,
            node_to_delete: null,
            node_to_delete_value: null
          }));
          finishOperation(`Only node with value ${nodeToDelete.value} deleted.`);
        });
      } else {
        let currentPos = 0;
        let currentNodeId = headId;
        let prevNodeId: string | null = null;
        let nodeToDelete: ListNode | null = null;
        
        steps.push(async () => { // 1. Traverse to second last node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [13,14,15,16,17] : [10,11,12,13]);
          setMessage(`Traversing to second last node...`);
          
          while (currentNodeId) {
            const node = list.find(n => n.id === currentNodeId);
            if (!node) break;
            
            // Stop at second last node
            if (node.next && list.find(n => n.id === node.next)?.next === null) {
              prevNodeId = currentNodeId;
              currentNodeId = node.next;
              break;
            }
            
            setCurrentNode(node.id);
            setProgramStateView(prev => ({
              ...prev,
              current_node: node.id,
              current_node_value: node.value,
              current_position: currentPos,
              status: `Traversing... Current at position ${currentPos}`
            }));
            
            await highlightNode(node.id);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            
            prevNodeId = currentNodeId;
            currentNodeId = node.next;
            currentPos++;
          }
        });

        steps.push(async () => { // 2. Delete last node
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [18,19,20] : [14,15]);
          setMessage(`Deleting last node...`);
          
          if (currentNodeId) {
            nodeToDelete = list.find(n => n.id === currentNodeId) || null;
            if (nodeToDelete) {
              setProgramStateView(prev => ({
                ...prev,
                node_to_delete: nodeToDelete!.id,
                node_to_delete_value: nodeToDelete!.value,
                status: "Deleting last node..."
              }));
              
              await highlightNode(nodeToDelete.id);
              await animateNodeOut(nodeToDelete.id);
              
              // Update the list
              const updatedList = [...list];
              const prevNodeIndex = updatedList.findIndex(n => n.id === prevNodeId);
              if (prevNodeIndex !== -1) {
                updatedList[prevNodeIndex] = {
                  ...updatedList[prevNodeIndex],
                  next: null
                };
                updatedList.splice(prevNodeIndex + 1, 1);
                setList(updatedList);
                
                await animateArrow(prevNodeId!, null);
                await new Promise(r => setTimeout(r, STEP_DELAY_MS));
              }
            }
          }
        });

        steps.push(() => { // 3. Operation complete
          setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 22 : 17]);
          setProgramStateView(prev => ({
            ...prev,
            status: "Delete at tail completed",
            current_size: currentListSize - 1,
            current_node: null,
            current_node_value: null,
            current_position: null,
            node_to_delete: null,
            node_to_delete_value: null
          }));
          finishOperation(`Tail node with value ${nodeToDelete?.value} deleted.`);
        });
      }
    }

    // --- DELETE AT POSITION Operation Steps ---
    else if (op === 'deleteAtPosition') {
      if (currentListSize === 0) {
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [2,3,4,5,6] : [2,3,4,5]);
          setMessage(`List is empty - nothing to delete!`);
          setProgramStateView(prev => ({
            ...prev,
            status: "Error: List is empty"
          }));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          finishOperation("List is empty - nothing to delete!");
        });
      } else if (pos === 0) {
        // Same as delete at head
        steps.push(async () => {
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [7,8,9,10,11] : [6,7,8,9]);
          setMessage(`Position 0 - deleting head node...`);
          
          const nodeToDelete = list[0];
          await highlightNode(nodeToDelete.id);
          await animateNodeOut(nodeToDelete.id);
          
          setHeadId(nodeToDelete.next);
          setList(prev => prev.slice(1));
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          setProgramStateView(prev => ({
            ...prev,
            status: "Delete at position 0 completed",
            current_size: currentListSize - 1,
            head: nodeToDelete.next,
            node_to_delete: null,
            node_to_delete_value: null
          }));
          finishOperation(`Node at position 0 (head) with value ${nodeToDelete.value} deleted.`);
        });
      } else {
        let currentPos = 0;
        let currentNodeId = headId;
        let prevNodeId: string | null = null;
        let nodeToDelete: ListNode | null = null;
        
        steps.push(async () => { // 1. Traverse to position
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [12,13,14,15,16] : [9,10,11,12,13,14,15]);
          setMessage(`Traversing to position ${pos}...`);
          
          while (currentNodeId && currentPos < pos - 1) {
            const node = list.find(n => n.id === currentNodeId);
            if (!node) break;
            
            setCurrentNode(node.id);
            setProgramStateView(prev => ({
              ...prev,
              current_node: node.id,
              current_node_value: node.value,
              current_position: currentPos,
              status: `Traversing... Current at position ${currentPos}`
            }));
            
            await highlightNode(node.id);
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            
            prevNodeId = currentNodeId;
            currentNodeId = node.next;
            currentPos++;
          }
        });

        steps.push(async () => { // 2. Check position validity
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [17,18,19,20,21] : [16,17,18,19]);
          setMessage(`Checking if position ${pos} is valid...`);
          
          const node = list.find(n => n.id === currentNodeId);
          if (!currentNodeId || !node) {
            setMessage(`Position ${pos} is out of bounds!`);
            setProgramStateView(prev => ({
              ...prev,
              status: `Error: Position ${pos} out of bounds`,
              current_node: null,
              current_node_value: null,
              current_position: null
            }));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            finishOperation(`Position ${pos} is out of bounds!`);
            return;
          }
          
          nodeToDelete = node;
        });

        steps.push(async () => { // 3. Delete node at position
          setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [22,23,24,25] : [20,21,22]);
          setMessage(`Deleting node at position ${pos}...`);
          
          setProgramStateView(prev => ({
            ...prev,
            node_to_delete: nodeToDelete!.id,
            node_to_delete_value: nodeToDelete!.value,
            status: "Deleting node..."
          }));
          
          await highlightNode(nodeToDelete!.id);
          await animateNodeOut(nodeToDelete!.id);
          
          // Update the list
          const updatedList = [...list];
          const prevNodeIndex = updatedList.findIndex(n => n.id === prevNodeId);
          const deleteNodeIndex = updatedList.findIndex(n => n.id === nodeToDelete!.id);
          
          if (prevNodeIndex !== -1 && deleteNodeIndex !== -1) {
            updatedList[prevNodeIndex] = {
              ...updatedList[prevNodeIndex],
              next: nodeToDelete!.next
            };
            
            updatedList.splice(deleteNodeIndex, 1);
            setList(updatedList);
            
            if (nodeToDelete!.next) {
              await animateArrow(prevNodeId!, nodeToDelete!.next);
            } else {
              await animateArrow(prevNodeId!, null);
            }
            
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          }
        });

        steps.push(() => { // 4. Operation complete
          setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 27 : 23]);
          setProgramStateView(prev => ({
            ...prev,
            status: "Delete at position completed",
            current_size: currentListSize - 1,
            current_node: null,
            current_node_value: null,
            current_position: null,
            node_to_delete: null,
            node_to_delete_value: null
          }));
          finishOperation(`Node at position ${pos} with value ${nodeToDelete?.value} deleted.`);
        });
      }
    }

    // --- SEARCH Operation Steps ---
    else if (op === 'search') {
      let currentPos = 0;
      let currentNodeId = headId;
      let found = false;
      
      steps.push(async () => { // Initialize search
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1,2,3] : [1,2,3]);
        setMessage(`Searching for value ${val}...`);
        setProgramStateView(prev => ({
          ...prev,
          search_value: val,
          search_result: null,
          status: "Searching..."
        }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });

      steps.push(async () => { // Traverse and search
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [4,5,6,7,8,9,10] : [4,5,6,7,8,9]);
        
        while (currentNodeId) {
          const node = list.find(n => n.id === currentNodeId);
          if (!node) break;
          
          setCurrentNode(node.id);
          setProgramStateView(prev => ({
            ...prev,
            current_node: node.id,
            current_node_value: node.value,
            current_position: currentPos,
            status: `Searching... Current at position ${currentPos}`
          }));
          
          await highlightNode(node.id);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          if (String(node.value) === val) {
            found = true;
            setResultValue(currentPos);
            setProgramStateView(prev => ({
              ...prev,
              search_result: currentPos,
              status: `Found at position ${currentPos}`
            }));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            break;
          }
          
          currentNodeId = node.next;
          currentPos++;
        }
      });

      steps.push(() => { // Search result
        setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 12 : 9]);
        if (found) {
          setMessage(`Value ${val} found at position ${resultValue}.`);
          setProgramStateView(prev => ({
            ...prev,
            status: `Search completed - found at position ${resultValue}`
          }));
        } else {
          setMessage(`Value ${val} not found in the list.`);
          setResultValue(-1);
          setProgramStateView(prev => ({
            ...prev,
            search_result: -1,
            status: "Search completed - not found"
          }));
        }
        finishOperation();
      });
    }

    // --- TRAVERSE Operation Steps ---
    else if (op === 'traverse') {
      let currentPos = 0;
      let currentNodeId = headId;
      let output = "";
      
      steps.push(async () => { // Initialize traversal
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [1,2] : [1,2]);
        setMessage(`Starting traversal...`);
        setProgramStateView(prev => ({
          ...prev,
          status: "Starting traversal...",
          output: ""
        }));
        await new Promise(r => setTimeout(r, STEP_DELAY_MS / 2));
      });

      steps.push(async () => { // Traverse each node
        setCurrentCodeLineHighlights(codeLanguageMode === 'c' ? [3,4,5,6] : [3,4,5,6]);
        
        while (currentNodeId) {
          const node = list.find(n => n.id === currentNodeId);
          if (!node) break;
          
          setCurrentNode(node.id);
          setProgramStateView(prev => ({
            ...prev,
            current_node: node.id,
            current_node_value: node.value,
            current_position: currentPos,
            status: `Traversing... Current at position ${currentPos}`
          }));
          
          output += `${node.value} `;
          setProgramStateView(prev => ({
            ...prev,
            output: output.trim()
          }));
          
          await highlightNode(node.id);
          await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          
          currentNodeId = node.next;
          currentPos++;
        }
      });

      steps.push(() => { // Traversal complete
        setCurrentCodeLineHighlights([codeLanguageMode === 'c' ? 8 : 6]);
        setMessage(`Traversal complete: ${output.trim()}`);
        setProgramStateView(prev => ({
          ...prev,
          status: "Traversal completed",
          current_node: null,
          current_node_value: null,
          current_position: null
        }));
        finishOperation();
      });
    }

    // Set up the operation steps
    setOperationSteps(steps);
    setCurrentStepIndex(0);
    setActiveOperationType(op);
    setIsOperationActive(true);
    
    // Start auto execution if in auto mode
    if (executionMode === 'auto') {
      executeNextStep();
    }
  }, [list, headId, codeLanguageMode, executionMode, finishOperation]);

  const executeNextStep = useCallback(async () => {
    if (!isOperationActive || currentStepIndex >= operationSteps.length) {
      setIsOperationActive(false);
      return;
    }

    setIsStepExecuting(true);
    const step = operationSteps[currentStepIndex];
    
    try {
      await step();
    } catch (error) {
      console.error("Error executing step:", error);
      finishOperation("Error during operation execution.");
      return;
    }

    setCurrentStepIndex(prev => prev + 1);
    setIsStepExecuting(false);

    // Continue auto execution if not at the end
    if (executionMode === 'auto' && currentStepIndex + 1 < operationSteps.length) {
      timeoutRef.current = setTimeout(executeNextStep, STEP_DELAY_MS);
    }
  }, [operationSteps, currentStepIndex, isOperationActive, executionMode, finishOperation]);

  const handleOperationClick = (op: Operation) => {
    if (isOperationActive && executionMode === 'auto') {
      setMessage("Operation in progress. Please wait or pause first.");
      return;
    }

    setCurrentOperationForModal(op);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (details: { value?: string; position?: string }) => {
    setIsModalOpen(false);
    if (currentOperationForModal) {
      prepareOperation(currentOperationForModal, details);
    }
  };

  const handleStepThrough = () => {
    if (isOperationActive) {
      if (executionMode === 'step') {
        executeNextStep();
      } else {
        setExecutionMode('step');
      }
    } else {
      setMessage("No active operation to step through.");
    }
  };

  const handleAutoRun = () => {
    if (isOperationActive) {
      if (executionMode === 'auto') {
        // Pause auto execution
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setExecutionMode('paused');
        setMessage("Operation paused. Click 'Auto Run' to continue.");
      } else {
        // Resume auto execution
        setExecutionMode('auto');
        executeNextStep();
      }
    } else {
      setMessage("No active operation to auto run.");
    }
  };

  const handleReset = () => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset all operation states
    setIsOperationActive(false);
    setExecutionMode('idle');
    setCurrentStepIndex(0);
    setOperationSteps([]);
    setActiveOperationType(null);
    setHighlightedNodes([]);
    setCurrentNode(null);
    setResultValue(null);
    setMessage("Operation reset. Choose a new operation.");
    setProgramStateView(prev => ({
      ...prev,
      status: "Ready",
      current_node: null,
      current_node_value: null,
      current_position: null,
      search_result: null
    }));
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // --- Rendering Functions ---
  const renderNode = (node: ListNode, index: number) => {
    const isHead = node.id === headId;
    const isHighlighted = highlightedNodes.includes(node.id) || currentNode === node.id;
    const isNewNode = activeOperationType?.startsWith('insert') && 
                      currentStepIndex > 0 && 
                      currentStepIndex < operationSteps.length - 1;

    const nodeStyle = {
      width: `${NODE_WIDTH_PX}px`,
      height: `${NODE_HEIGHT_PX}px`,
      backgroundColor: isHighlighted ? '#F59E0B' : '#1E40AF',
      borderColor: isNewNode ? '#10B981' : '#1E40AF',
      borderWidth: isNewNode ? '3px' : '1px',
      marginRight: `${NODE_SPACING_PX}px`,
      transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
      transition: 'all 0.3s ease',
    };

    return (
      <div 
        key={node.id}
        ref={el => { elementsRef.current.set(node.id, el); }}
        className="flex flex-col items-center transition-all duration-300"
        style={{ marginRight: `${NODE_SPACING_PX}px` }}
      >
        <div 
          className="flex flex-col items-center justify-center rounded-lg shadow-md text-white font-mono relative"
          style={nodeStyle}
        >
          <span className="text-xs absolute -top-5 left-0 text-gray-300">
            {isHead ? 'head' : `node ${index}`}
          </span>
          <span className="text-lg font-bold">{node.value}</span>
        </div>
        
        {/* Next pointer arrow */}
        {node.next && (
          <div 
            ref={el => { arrowsRef.current.set(`arrow-${node.id}`, el); }}
            className="h-1 bg-gray-400 relative mt-2"
            style={{ width: `${NODE_SPACING_PX}px` }}
          >
            <div className="absolute right-0 top-1/2 w-3 h-3 border-r-2 border-t-2 border-gray-400 transform -translate-y-1/2 rotate-45"></div>
          </div>
        )}
        
        {/* NULL terminator for last node */}
        {!node.next && index === list.length - 1 && (
          <div className="mt-2 text-gray-400 font-mono text-sm">NULL</div>
        )}
      </div>
    );
  };

  const renderProgramState = () => {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-sm font-mono">
        <h3 className="text-sky-400 mb-2 font-semibold">Program State</h3>
        <div className="space-y-1">
          {Object.entries(programStateView).map(([key, value]) => (
            <div key={key} className="flex">
              <span className="text-gray-400 w-40 truncate">{key}:</span>
              <span className="text-gray-200 flex-1">
                {value === null ? 'NULL' : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCodeBlock = () => {
    return (
      <div className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-64">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sky-400 font-semibold">
            {activeOperationType ? `${activeOperationType} Code` : 'Select an Operation'}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCodeLanguageMode('c')}
              className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'c' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              C
            </button>
            <button 
              onClick={() => setCodeLanguageMode('python')}
              className={`px-2 py-1 text-xs rounded ${codeLanguageMode === 'python' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Python
            </button>
          </div>
        </div>
        <pre className="text-gray-300 text-xs overflow-auto">
          {currentOperationCode.map((line, index) => (
            <div 
              key={index}
              className={`py-1 px-2 ${currentCodeLineHighlights.includes(index) ? 'bg-gray-700 border-l-2 border-sky-400' : ''}`}
            >
              {line}
            </div>
          ))}
        </pre>
      </div>
    );
  };

  const renderOperationButtons = () => {
    const operations: Operation[] = [
      'insertAtHead', 'insertAtTail', 'insertAtPosition',
      'deleteAtHead', 'deleteAtTail', 'deleteAtPosition',
      'search', 'traverse'
    ];

    const buttonLabels = {
      'insertAtHead': 'Insert at Head',
      'insertAtTail': 'Insert at Tail',
      'insertAtPosition': 'Insert at Position',
      'deleteAtHead': 'Delete at Head',
      'deleteAtTail': 'Delete at Tail',
      'deleteAtPosition': 'Delete at Position',
      'search': 'Search',
      'traverse': 'Traverse'
    };

    return (
      <div className="grid grid-cols-2 gap-2">
        {operations.map(op => (
          <button
            key={op}
            onClick={() => handleOperationClick(op)}
            disabled={isOperationActive && executionMode === 'auto'}
            className={`py-2 px-3 rounded text-sm font-medium transition-colors
              ${isOperationActive && executionMode === 'auto' ? 
                'bg-gray-600 text-gray-400 cursor-not-allowed' : 
                'bg-gray-700 hover:bg-gray-600 text-gray-200'}
            `}
          >
            {buttonLabels[op as Exclude<Operation, 'idle'>]}
          </button>
        ))}
      </div>
    );
  };

  const renderControlButtons = () => {
    return (
      <div className="flex space-x-2 mt-4">
        <button
          onClick={handleStepThrough}
          disabled={!isOperationActive || executionMode === 'auto'}
          className={`py-2 px-4 rounded text-sm font-medium flex-1
            ${!isOperationActive || executionMode === 'auto' ? 
              'bg-gray-600 text-gray-400 cursor-not-allowed' : 
              'bg-blue-600 hover:bg-blue-500 text-white'}
          `}
        >
          {executionMode === 'step' ? 'Next Step' : 'Step Through'}
        </button>
        
        <button
          onClick={handleAutoRun}
          disabled={!isOperationActive}
          className={`py-2 px-4 rounded text-sm font-medium flex-1
            ${!isOperationActive ? 
              'bg-gray-600 text-gray-400 cursor-not-allowed' : 
              executionMode === 'auto' ? 
                'bg-yellow-600 hover:bg-yellow-500 text-white' : 
                'bg-green-600 hover:bg-green-500 text-white'}
          `}
        >
          {executionMode === 'auto' ? 'Pause' : 'Auto Run'}
        </button>
        
        <button
          onClick={handleReset}
          className="py-2 px-4 rounded text-sm font-medium flex-1 bg-red-600 hover:bg-red-500 text-white"
        >
          Reset
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-3xl font-bold mb-8 text-white">Linked List Operations Visualizer</h1>

      {/* Main content container */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        {/* Left section (65%) - Controls, Visualization, and Program State */}
        <div className="lg:w-2/3 space-y-4">
          {/* Operation buttons */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-sky-400">Operations</h2>
            {renderOperationButtons()}
          </div>

          {/* Execution controls */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-sky-400">Controls</h2>
            {renderControlButtons()}
          </div>

          {/* Status message */}
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <div className="text-yellow-400 text-sm">
              {message}
              {resultValue !== null && (
                <div className="mt-2 text-green-400">
                  Result: {resultValue}
                </div>
              )}
            </div>
          </div>

          {/* Visualization area */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-sky-400">Visualization</h2>
            <div ref={elementsContainerRef}
              className="bg-gray-900/60 p-6 rounded-lg min-h-[200px] flex items-center overflow-x-auto">
              {list.length === 0 ? (
                <div className="text-gray-500 italic w-full text-center">
                  List is empty. Add nodes to visualize.
                </div>
              ) : (
                <div className="flex items-center">
                  {list.map((node, index) => renderNode(node, index))}
                </div>
              )}
            </div>
          </div>

          {/* Program state */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-sky-400">Program State</h2>
            {renderProgramState()}
          </div>
        </div>

        {/* Right section (35%) - Code Display */}
        <div className="lg:w-1/3">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-sky-400">Code</h2>
              <div className="flex space-x-2">
                <button onClick={() => setCodeLanguageMode('c')}
                  className={`px-3 py-1 rounded text-sm ${codeLanguageMode === 'c' ? 'bg-sky-600' : 'bg-gray-700'}`}>
                  C
                </button>
                <button onClick={() => setCodeLanguageMode('python')}
                  className={`px-3 py-1 rounded text-sm ${codeLanguageMode === 'python' ? 'bg-sky-600' : 'bg-gray-700'}`}>
                  Python
                </button>
              </div>
            </div>
            {renderCodeBlock()}
          </div>
        </div>
      </div>

      <OperationModal
        isOpen={isModalOpen}
        operation={currentOperationForModal}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default LinkedListOperationsVisualizer;