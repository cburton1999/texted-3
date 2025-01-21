"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MapIcon } from 'lucide-react';

export const MapNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-[280px] shadow-lg rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-4 h-4 text-blue-500" />
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.label}</div>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {data.description}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
});