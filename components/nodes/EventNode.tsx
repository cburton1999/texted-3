"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, PlayCircle, Command } from 'lucide-react';
import { EVENT_TYPE_NAMES, ACTION_TYPE_NAMES } from '@/lib/types/game';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const EventNode = memo(({ data, isConnectable, selected }: any) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`w-[280px] shadow-lg rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-200 ${
          selected ? 'ring-4 ring-yellow-500 shadow-yellow-500/20 scale-105' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          data.onClick?.();
        }}>
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-yellow-500"
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.label}</div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {typeof data.event.Event === 'string' && data.event.Event.startsWith('custom-') 
                ? `Custom: ${data.event.Event.replace('custom-', '')}`
                : EVENT_TYPE_NAMES[data.event.Event]
              }
            </div>
            {data.event.Actions?.length > 0 && (
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Actions:</div>
                {data.event.Actions.map((action: any, index: number) => {
                  let actionText = ACTION_TYPE_NAMES[action.Event];
                  if (action.Event === 1 && action.itemName) { // ADD_ITEM
                    actionText += `: ${action.itemName}`;
                  }
                  return (
                    <div key={index} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <PlayCircle className="w-3 h-3 text-blue-500" />
                      <span className="truncate">{actionText}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {data.event.CustomCommands?.length > 0 && (
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Custom Commands:</div>
                {data.event.CustomCommands.map((command: any, index: number) => (
                  <div key={index} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Command className="w-3 h-3 text-indigo-500" />
                    <span className="truncate">{command.Verb}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-yellow-500"
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            const newCommand = {
              Verb: '',
              RequiredItems: [],
              RequiredFlags: [],
              Actions: []
            };
            const updatedEvent = {
              ...data.event,
              CustomCommands: [...(data.event.CustomCommands || []), newCommand]
            };
            data.onChange?.({ event: updatedEvent });
          }}
        >
          Add Custom Command
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});