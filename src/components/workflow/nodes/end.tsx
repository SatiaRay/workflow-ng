// components/workflow/nodes/EndNode.tsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const EndNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-white dark:bg-gray-800 border-2 border-red-500">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-red-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900">
          <div className="w-6 h-6 rounded-full bg-red-500"></div>
        </div>
        <div className="ml-3">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {data.label || 'پایان'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {data.description || 'پایان فرآیند'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(EndNode);