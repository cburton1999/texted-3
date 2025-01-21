"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, ChevronRight } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const LocationNode = memo(({ data, isConnectable, selected }: any) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`w-[280px] shadow-lg rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 ${
          selected ? 'ring-4 ring-emerald-500 shadow-emerald-500/20 scale-105' : data.expanded ? 'ring-2 ring-emerald-500/50' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          data.onClick?.();
        }}>
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-emerald-500"
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Box className="w-4 h-4 text-emerald-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {data.label}
                <ChevronRight 
                  className={`w-4 h-4 text-gray-500 transition-transform ${data.expanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {data.description}
            </div>
            {data.expanded && data.items?.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Items: {data.items.join(', ')}
              </div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-emerald-500"
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
        >
          {data.expanded ? 'Collapse' : 'Expand'} Location
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});