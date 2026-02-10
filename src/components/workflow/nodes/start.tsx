// components/workflow/nodes/StartNode.tsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const StartNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-white dark:bg-gray-800 border-2 border-green-500">
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900">
          <div className="w-6 h-6 rounded-full bg-green-500"></div>
        </div>
        <div className="ml-3">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {data.label || 'شروع'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {data.description || 'نقطه شروع فرآیند'}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
};

export default memo(StartNode);