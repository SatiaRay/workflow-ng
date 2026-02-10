import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileEdit } from 'lucide-react';

const FillFormNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-2 border-cyan-500 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-cyan-500"
      />
      
      <div className="flex items-start">
        <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900 shrink-0">
          <FileEdit className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.label || 'تکمیل فرم'}
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {data.description || 'تکمیل فرم توسط کاربر'}
          </div>
          
          {data.form && (
            <div className="mt-2">
              <div className="flex items-center">
                <FileEdit className="w-3 h-3 mr-1 text-cyan-600" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {data.form.title}
                </span>
              </div>
              
              {data.form.fields && (
                <div className="mt-1 text-xs text-gray-500">
                  {data.form.fields.length} فیلد
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-cyan-500"
      />
    </div>
  );
};

export default memo(FillFormNode);