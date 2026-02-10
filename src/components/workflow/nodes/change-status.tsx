import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { RefreshCw } from 'lucide-react';

const ChangeStatusNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-2 border-indigo-500 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-indigo-500"
      />
      
      <div className="flex items-start">
        <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 shrink-0">
          <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.label || 'تغییر وضعیت'}
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {data.description || 'تغییر وضعیت وظیفه'}
          </div>
          
          {data.status && (
            <div className="mt-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: data.statusColor || '#6b7280' }}
                ></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  وضعیت: {data.statusLabel || data.status}
                </span>
              </div>
            </div>
          )}
          
          {data.assignToRole && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                واگذاری به: {data.assignToRole.name}
              </span>
            </div>
          )}
          
          {data.shouldReassign && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                واگذاری مجدد
              </span>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-indigo-500"
      />
    </div>
  );
};

export default memo(ChangeStatusNode);