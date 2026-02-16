import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const DecisionNode = ({ data }) => {
  const hasConditions = data.conditions && data.conditions.length > 0;
  
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-white dark:bg-gray-800 border-2 border-yellow-500 min-w-[180px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-yellow-500"
      />
      
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900 rounded-lg mb-2">
          <div className="w-8 h-8 bg-yellow-500 rounded transform rotate-45"></div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {data.label || 'تصمیم'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {data.description || 'تصمیم گیری'}
          </div>
        </div>
      </div>
      
      {/* Dynamic output handles on the right */}
      {hasConditions ? (
        data.conditions.map((condition, index) => (
          <Handle
            key={index}
            type="source"
            position={Position.Right}
            id={condition}
            className="w-3 h-3 !bg-yellow-500"
            style={{
              top: `${((index + 1) * 100) / (data.conditions.length + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-yellow-500"
        />
      )}
    </div>
  );
};

export default memo(DecisionNode);