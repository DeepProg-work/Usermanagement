import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { codeTheme, operationCodes } from './style';
import { LinkedList } from './linkedListLogic';
import { LinkedListNode, LinkedListOperation } from './types';

const LinkedListVisualizer = () => {

  
  const [linkedList] = useState<LinkedList>(new LinkedList());
  const [nodes, setNodes] = useState<LinkedListNode[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [operation, setOperation] = useState<LinkedListOperation>('append');
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Animation variants
  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const pointerVariants = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 }
  };

  const handleOperation = async () => {
    if (isAnimating || !inputValue) return;
    if (operation === 'insertAfter' && !targetValue) return;
    
    setIsAnimating(true);
    setHighlightedLine(1);
    
    // Simulate step-by-step execution
    const steps = operation === 'insertAfter' ? 4 : 3;
    for (let i = 1; i <= steps; i++) {
      setHighlightedLine(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Perform the actual operation
    let newNodes: LinkedListNode[];
    switch (operation) {
      case 'append':
        newNodes = linkedList.append(inputValue);
        break;
      case 'prepend':
        newNodes = linkedList.prepend(inputValue);
        break;
      case 'delete':
        newNodes = linkedList.delete(inputValue);
        break;
      case 'insertAfter':
        newNodes = linkedList.insertAfter(targetValue, inputValue);
        break;
      default:
        newNodes = linkedList.append(inputValue);
    }
    
    setNodes(newNodes);
    setInputValue('');
    setTargetValue('');
    setHighlightedLine(null);
    setIsAnimating(false);
  };

  useEffect(() => {
    // Initialize with some nodes
    linkedList.append('10');
    linkedList.append('20');
    linkedList.append('30');
    setNodes(linkedList.toArray());
  }, [linkedList]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Linked List Visualizer</h1>
        
        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={operation}
              onChange={(e) => setOperation(e.target.value as LinkedListOperation)}
            >
              <option value="append">Append</option>
              <option value="prepend">Prepend</option>
              <option value="delete">Delete</option>
              <option value="insertAfter">Insert After</option>
            </select>
            
            {operation === 'insertAfter' && (
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Target node value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            )}
            
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={operation === 'delete' ? 'Value to delete' : 'New node value'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              onClick={handleOperation}
              disabled={isAnimating || !inputValue || (operation === 'insertAfter' && !targetValue)}
            >
              {isAnimating ? 'Processing...' : 'Execute'}
            </button>
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Code Display */}
          <div className="lg:w-1/2 bg-gray-800 rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language="typescript"
              style={codeTheme}
              showLineNumbers
              wrapLines
              lineProps={(lineNumber) => ({
                style: {
                  display: 'block',
                  backgroundColor: lineNumber === highlightedLine ? 'rgba(255, 255, 0, 0.2)' : 'transparent',
                },
              })}
            >
              {operationCodes[operation]}
            </SyntaxHighlighter>
          </div>
          
          {/* Linked List Visualization */}
          <div className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md">
            <div className="min-h-[300px] flex items-center justify-center">
              {nodes.length === 0 ? (
                <p className="text-gray-500">The list is empty</p>
              ) : (
                <div className="relative w-full">
                  {/* Circular layout */}
                  <div className="relative h-64 w-full">
                    <AnimatePresence>
                      {nodes.map((node, index) => {
                        // Calculate position in circle
                        const angle = (index * (2 * Math.PI)) / nodes.length;
                        const radius = 100;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        
                        return (
                          <motion.div
                            key={node.id}
                            className={`absolute w-16 h-16 flex items-center justify-center rounded-full border-2 ${
                              index === 0 ? 'border-green-500 bg-green-100' : 
                              index === nodes.length - 1 ? 'border-red-500 bg-red-100' : 
                              'border-blue-500 bg-blue-100'
                            }`}
                            style={{
                              left: `calc(50% + ${x}px)`,
                              top: `calc(50% + ${y}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={nodeVariants}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="font-mono font-bold">{node.value}</span>
                            
                            {/* Head/Tail indicators */}
                            {index === 0 && (
                              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-600">HEAD</span>
                            )}
                            {index === nodes.length - 1 && (
                              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600">TAIL</span>
                            )}
                            
                            {/* Pointer */}
                            {index < nodes.length - 1 && (
                              <motion.svg
                                className="absolute w-16 h-16 pointer-events-none"
                                style={{
                                  left: `calc(50% + ${x}px)`,
                                  top: `calc(50% + ${y}px)`,
                                  transform: 'translate(-50%, -50%) rotate(0deg)'
                                }}
                                viewBox="0 0 100 100"
                              >
                                <motion.path
                                  d={`M 50 50 L ${50 + x} ${50 + y}`}
                                  stroke="gray"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeDasharray="0"
                                  variants={pointerVariants}
                                  initial="initial"
                                  animate="animate"
                                  transition={{ duration: 1 }}
                                />
                                <motion.path
                                  d="M 10 50 L 0 40 L 0 60 Z"
                                  stroke="gray"
                                  fill="gray"
                                  transform={`rotate(${(angle * 180) / Math.PI + 90} 50 50)`}
                                  variants={pointerVariants}
                                  initial="initial"
                                  animate="animate"
                                  transition={{ duration: 1 }}
                                />
                              </motion.svg>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="font-mono">
                <span className="font-bold">Size:</span> {nodes.length}
              </p>
              <p className="font-mono mt-2">
                <span className="font-bold">Head:</span> {nodes[0]?.value || 'null'}
              </p>
              <p className="font-mono mt-2">
                <span className="font-bold">Tail:</span> {nodes[nodes.length - 1]?.value || 'null'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;