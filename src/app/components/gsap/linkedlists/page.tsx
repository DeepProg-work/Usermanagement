'use client';

import React, { useCallback, useState, useEffect, JSX } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  XYPosition,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './components/CustomNode'; // Ensure this path is correct

// TypeScript Interfaces and Types
interface CustomNodeData {
  label: string;
  value?: number | string;
}

type LinkedListNode = Node<CustomNodeData>;
type LinkedListEdge = Edge;

// Constants for the list structure
const TAIL_NODE_ID = 'tail';
const HEAD_NODE_ID = 'head';

// Initial Staging Position and Increments
const INITIAL_STAGING_POSITION: XYPosition = { x: 150, y: 70 };
const STAGING_POSITION_X_INCREMENT = 30;
const STAGING_POSITION_Y_INCREMENT = 20;

const initialNodesData: LinkedListNode[] = [
  { id: HEAD_NODE_ID, type: 'custom', data: { label: 'Head' }, position: { x: 50, y: 200 } },
  { id: '1', type: 'custom', data: { label: 'Node 1', value: 10 }, position: { x: 250, y: 200 } },
  { id: TAIL_NODE_ID, type: 'custom', data: { label: 'Tail' }, position: { x: 450, y: 200 } },
];

const initialEdgesData: LinkedListEdge[] = [
  { id: 'e-head-1', source: HEAD_NODE_ID, target: '1', markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#FF0072' }, style: { strokeWidth: 2, stroke: '#FF0072' }, animated: true },
  { id: 'e-1-tail', source: '1', target: TAIL_NODE_ID, markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#FF0072' }, style: { strokeWidth: 2, stroke: '#FF0072' }, animated: true },
];

const nodeTypes = { custom: CustomNode };

// For step-by-step animation
interface InsertionProcessData {
  newNodeId: string;
  newNodeToAdd: LinkedListNode;
  previousNodeIdToLinkFrom: string;
  edgeIdToRemove?: string;
}

// C Code for display
const cCodeSnippet = [
  "// Node structure",
  "struct Node {",
  "    int data;",
  "    struct Node* next;",
  "};",
  "",
  "// Function to insert a node at the end",
  "void insertAtEnd(struct Node** head_ref, int new_data) {",
  "    // Allocate node & assign data",
  "    struct Node* new_node = (struct Node*) malloc(sizeof(struct Node)); ",
  "    new_node->data = new_data;",
  "    new_node->next = NULL; /* Becomes the new tail initially         ",
  "",
  "    // If the Linked List is empty, make new node as head",
  "    if (*head_ref == NULL) {                                           ",
  "       *head_ref = new_node;",
  "       return;",
  "    }",
  "",
  "    // Else traverse till the last node",
  "    struct Node* last = *head_ref;                                   ",
  "    // ink last node to the new node",
  "    while (last->next != NULL) {          ",
  "        last = last->next;",
  "    }",
  "    last->next = new_node; /* Link previous last to new node */        ",
  "",
  "    // New node is now the end ",
  
  "    return;                                                             ",
  "}",
];

// Helper to get highlighted lines for C code
const getHighlightedCLines = (step: number): number[] => {
  switch (step) {
    case 1: // Node appears
      return [10, 11, 12];
    case 2: // First edge (Prev -> NewNode)
      return [21, 23, 24, 26]; // Traversal and linking
    case 3: // Second edge (NewNode -> Tail sentinel in viz)
      return [30]; // Corresponds to function completion in C
    default:
      return [];
  }
};


// C Code Display Component
interface CCodeDisplayProps {
  codeLines: string[];
  highlightedLines: number[];
}
const CCodeDisplay: React.FC<CCodeDisplayProps> = ({ codeLines, highlightedLines }) => {
  const highlightSyntax = (line: string, isHighlighted: boolean): JSX.Element => {
    const keywords = /\b(void|int|struct|if|else|while|return|NULL|malloc|sizeof)\b/g;
    const types = /\b(Node)\b/g; 
    const comments = /(\/\/.*|\/\*.*\*\/)/g;
    const baseTextColor = isHighlighted ? "text-gray-100" : "text-gray-300";
    const keywordColor = isHighlighted ? "text-yellow-300 font-semibold" : "text-pink-400 font-semibold";
    const typeColor = isHighlighted ? "text-cyan-300" : "text-teal-400";
    const commentColor = isHighlighted ? "text-green-300" : "text-green-400";

    let processedLine = line
      .replace(comments, `<span class="${commentColor}">$1</span>`)
      .replace(keywords, (match) => !line.includes("</span>") || line.substring(line.indexOf(match)-20, line.indexOf(match)+match.length+20).indexOf("</span>") === -1 ? `<span class="${keywordColor}">${match}</span>` : match)
      .replace(types, (match) => !line.includes("</span>") || line.substring(line.indexOf(match)-20, line.indexOf(match)+match.length+20).indexOf("</span>") === -1 ? `<span class="${typeColor}">${match}</span>` : match);
    
    if (isHighlighted && !processedLine.match(/<span class=/)) {
       processedLine = `<span class="${baseTextColor}">${processedLine}</span>`;
    }
    return <span dangerouslySetInnerHTML={{ __html: processedLine }} />;
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-sky-300 mb-3 flex-shrink-0">C Code: Insert at End</h3>
      <pre className="font-mono text-sm whitespace-pre-wrap flex-grow overflow-auto text-left p-1">
        <code>
          {codeLines.map((line, index) => {
            const isLineHighlighted = highlightedLines.includes(index + 1);
            return (
              <div
                key={index}
                className={`flex items-baseline min-h-[1.5em] ${
                  isLineHighlighted ? 'bg-sky-700/80 rounded-sm' : ''
                }`}
              >
                <span className={`select-none pr-4 pl-1 w-12 text-right flex-shrink-0 ${
                    isLineHighlighted ? 'text-sky-200' : 'text-gray-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="whitespace-pre-wrap">
                    {highlightSyntax(line, isLineHighlighted)}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
};

// Main Component
function LinkedListFlow() {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodesData);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdgesData);
  const [nextNodeStagingPosition, setNextNodeStagingPosition] = useState<XYPosition>(INITIAL_STAGING_POSITION);

  const [isInserting, setIsInserting] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [insertionData, setInsertionData] = useState<InsertionProcessData | null>(null);
  const [highlightedCLines, setHighlightedCLines] = useState<number[]>([]);

  useEffect(() => {
    if (isInserting) {
      setHighlightedCLines(getHighlightedCLines(animationStep));
    } else {
      setHighlightedCLines([]);
    }
  }, [animationStep, isInserting]);

  const onNodesChange: OnNodesChange = (changes: NodeChange[]) => onNodesChangeInternal(changes);
  const onEdgesChange: OnEdgesChange = (changes: EdgeChange[]) => onEdgesChangeInternal(changes);

  const onConnect: OnConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#FF0072', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#FF0072', width: 20, height: 20 } }, eds)),
    [setEdges]
  );

  const startInsertionProcess = () => {
    if (isInserting) return;

    const currentNodesSnapshot = [...nodes];
    const currentEdgesSnapshot = [...edges];

    const dataNodes = currentNodesSnapshot.filter(node => node.id !== HEAD_NODE_ID && node.id !== TAIL_NODE_ID);
    let newNumericId;

    if (dataNodes.length === 0) {
      const initialDataNodeOneExists = currentNodesSnapshot.some(n => n.id === "1");
      const noNodeXFormatExists = !currentNodesSnapshot.some(n => n.id.startsWith("node-"));
      if (initialDataNodeOneExists && noNodeXFormatExists) {
        newNumericId = 2;
      } else {
        newNumericId = 1;
      }
    } else {
      newNumericId = Math.max(0, ...dataNodes.map(node => {
        const match = node.id.match(/^node-(\d+)$/) || node.id.match(/^(\d+)$/);
        return match ? (parseInt(match[1], 10) || 0) : 0;
      })) + 1;
    }
    const newNodeId = `node-${newNumericId}`;

    const newNodeToAdd: LinkedListNode = {
      id: newNodeId,
      type: 'custom',
      data: { label: `Node ${newNumericId}`, value: Math.floor(Math.random() * 100) },
      position: nextNodeStagingPosition,
    };

    let previousNodeIdToLinkFrom: string;
    let edgeIdToRemove: string | undefined;
    const edgePointingToTail = currentEdgesSnapshot.find(edge => edge.target === TAIL_NODE_ID);

    if (edgePointingToTail) {
      previousNodeIdToLinkFrom = edgePointingToTail.source;
      edgeIdToRemove = edgePointingToTail.id;
    } else {
      previousNodeIdToLinkFrom = HEAD_NODE_ID;
    }

    setInsertionData({
      newNodeId,
      newNodeToAdd,
      previousNodeIdToLinkFrom,
      edgeIdToRemove,
    });
    setIsInserting(true);
    setAnimationStep(1);
  };

  const handleNextStep = () => {
    if (!isInserting || !insertionData) return;

    const { newNodeId, newNodeToAdd, previousNodeIdToLinkFrom, edgeIdToRemove } = insertionData;

    switch (animationStep) {
      case 1:
        setNodes((currentNodes) => [...currentNodes, newNodeToAdd]);
        setAnimationStep(2);
        break;
      case 2:
        setEdges(prevEdges => {
          let updatedEdges = [...prevEdges];
          if (edgeIdToRemove) {
            updatedEdges = updatedEdges.filter(e => e.id !== edgeIdToRemove);
          }
          updatedEdges.push({
            id: `e-${previousNodeIdToLinkFrom}-${newNodeId}`,
            source: previousNodeIdToLinkFrom, target: newNodeId,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#FF0072' },
            style: { strokeWidth: 2, stroke: '#FF0072' }, animated: true,
          });
          return updatedEdges;
        });
        setAnimationStep(3);
        break;
      case 3:
        setEdges(prevEdges => {
          let updatedEdges = [...prevEdges];
          updatedEdges.push({
            id: `e-${newNodeId}-${TAIL_NODE_ID}`,
            source: newNodeId, target: TAIL_NODE_ID,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#4ade80' },
            style: { strokeWidth: 2, stroke: '#4ade80' }, animated: true,
          });
          return updatedEdges;
        });
        setNextNodeStagingPosition(prevStagingPosition => ({
          x: prevStagingPosition.x + STAGING_POSITION_X_INCREMENT,
          y: prevStagingPosition.y + STAGING_POSITION_Y_INCREMENT,
        }));
        setIsInserting(false);
        setAnimationStep(0);
        setInsertionData(null);
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-900 text-white">
      {/* Left Pane: React Flow Visualization */}
      <div className="w-2/3 p-4 md:p-8 flex flex-col items-center"> {/* Consistent padding with right pane's outer div */}
        <h1 className="text-3xl md:text-4xl font-bold text-sky-400 mb-6 text-center">
          Linked List - Stepped Insertion
        </h1>
        <div className="mb-4 space-x-2">
          <button
            onClick={startInsertionProcess}
            disabled={isInserting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors duration-300 disabled:bg-gray-500"
          >
            Start Insertion
          </button>
          {isInserting && (
            <button
              onClick={handleNextStep}
              disabled={animationStep === 0}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-700 text-white font-bold rounded transition-colors duration-300"
            >
              Next Step ({animationStep}/3)
            </button>
          )}
        </div>
        {/* This is the visualization box */}
        <div className="reactflow-wrapper flex-grow w-full max-w-screen-2xl border border-sky-500 rounded-lg shadow-2xl bg-gray-800">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            attributionPosition="top-right"
            className="bg-transparent"
          >
            <Controls className="[&>button]:!bg-sky-600 [&>button_path]:!fill-white hover:[&>button]:!bg-sky-700" />
            <Background color="#444" gap={20}  />
          </ReactFlow>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Use 'Start Insertion' then 'Next Step' to see the process.
        </p>
      </div>

      {/* Right Pane: C Code Visualization */}
      {/* Outer container for right pane, matching left pane's outer padding */}
      <div className="w-1/3 flex flex-col p-4 md:p-8">
        <div className="flex-grow border border-sky-500 rounded-lg shadow-xl bg-gray-800 p-4 flex flex-col overflow-hidden text-left">
          <CCodeDisplay codeLines={cCodeSnippet} highlightedLines={highlightedCLines} />
        </div>
      </div>
    </div>
  );
}

export default LinkedListFlow;
