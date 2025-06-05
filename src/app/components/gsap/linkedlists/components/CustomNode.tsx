import { Handle, Position, NodeProps } from 'reactflow';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Define a type for the node data
interface CustomNodeData {
  label: string;
  value?: number | string; // value is optional and can be number or string
}

// Use NodeProps with our custom data type
function CustomNode({ data, isConnectable }: NodeProps<CustomNodeData>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeRef.current) {
      gsap.fromTo(
        nodeRef.current,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  const isHead = data.label === 'Head';
  const isTail = data.label === 'Tail';
  const isRegularNode = !isHead && !isTail;

  let bgColor = 'bg-sky-600'; // Default for regular nodes
  if (isHead) {
    bgColor = 'bg-green-600';
  } else if (isTail) {
    bgColor = 'bg-red-600';
  }

  return (
    <div
      ref={nodeRef}
      className={`px-5 py-3 shadow-xl rounded-md border-2 border-stone-400 ${bgColor} text-white min-w-[100px] text-center`}
    >
      <div className="font-bold text-lg">{data.label}</div>
      {data.value !== undefined && isRegularNode && (
        <div className="text-sm mt-1">Value: {data.value}</div>
      )}

      {!isHead && ( // Head node only has a source
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!bg-gray-400 !w-3 !h-3"
        />
      )}
      {!isTail && ( // Tail node only has a target
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!bg-gray-400 !w-3 !h-3"
        />
      )}
    </div>
  );
}

export default CustomNode;