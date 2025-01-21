"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Command } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const CustomEventNode = memo(({ data, isConnectable, selected }: any) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`w-[280px] shadow-lg rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 ${
          selected ? 'ring-4 ring-indigo-500 shadow-indigo-500/20 scale-105' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          data.onClick?.();
        }}>
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-indigo-500"
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Command className="w-4 h-4 text-indigo-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.command ? `Command: ${data.command}` : 'New Custom Command'}
              </div>
            </div>
            {data.requiredItems?.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Required Items: {data.requiredItems.length}
              </div>
            )}
            {data.requiredFlags?.length > 0 && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Required Flags: {data.requiredFlags.length}
              </div>
            )}
            {data.actions?.length > 0 && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Actions: {data.actions.length}
              </div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-indigo-500"
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}
        >
          Delete Command
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});