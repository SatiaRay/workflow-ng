import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Filter } from 'lucide-react';

const ConditionNode = ({ data }) => {
  const hasConditions = data.conditionRules && data.conditionRules.length > 0;
  
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-2 border-orange-500 min-w-[220px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-orange-500"
      />
      
      <div className="flex items-start">
        <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-orange-100 dark:bg-orange-900 shrink-0">
          <Filter className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.label || 'شرط'}
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {data.description || 'بررسی شرط بر اساس فرم‌های قبلی'}
          </div>
          
          {hasConditions && (
            <div className="mt-2 space-y-1">
              {data.conditionRules.slice(0, 3).map((condition, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                  <div className="text-xs truncate">
                    {condition.field?.split('_').pop()} {condition.operator} {condition.value}
                  </div>
                </div>
              ))}
              {data.conditionRules.length > 3 && (
                <div className="text-xs text-gray-500">
                  + {data.conditionRules.length - 3} شرط دیگر
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic output handles on the right */}
      {hasConditions ? (
        data.conditionRules.map((condition, index) => (
          <Handle
            key={index}
            type="source"
            position={Position.Right}
            id={`condition-${index}`}
            className="w-3 h-3 !bg-orange-500"
            style={{
              top: `${((index + 1) * 100) / (data.conditionRules.length + 1)}%`,
              transform: 'translateY(-50%)',
            }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-orange-500"
        />
      )}
    </div>
  );
};

export default memo(ConditionNode);