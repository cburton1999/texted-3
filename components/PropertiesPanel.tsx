"use client";

import { useState, useEffect, useCallback } from 'react';
import { Node } from 'reactflow';
import { Game, EVENT_TYPES, EVENT_TYPE_NAMES, ACTION_TYPES, ACTION_TYPE_NAMES } from '@/lib/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X as XIcon, Plus, Trash2, Command } from 'lucide-react';

function LocationProperties({ data, onChange, game }: { data: any; onChange: (updates: any) => void; game: Game }) {
  console.log(data);

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Location Id (Must Be Unique)</label>
        <Input
          value={data.locationId}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ locationId: newValue });
          }}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Name</label>
        <Input
          value={data.label}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ label: newValue });
          }}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
        <Textarea
          value={data.description}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ description: newValue });
          }}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Items</label>
        <Select
          onValueChange={(value) => {
            const newItems = [...(data.items || [])];
            if (!newItems.includes(value)) {
              newItems.push(value);
              onChange({ items: newItems });
            }
          }}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectValue placeholder="Add an item..." />
          </SelectTrigger>
          <SelectContent>
            {game.Items.map((item) => (
              <SelectItem key={item.Id} value={item.Id}>
                {item.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 space-y-2">
          {data.items?.map((itemId: string, index: number) => {
            const item = game.Items.find(i => i.Id === itemId);
            return item ? (
              <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                <span className="text-gray-200">{item.Name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newItems = data.items.filter((_: string, i: number) => i !== index);
                    onChange({ items: newItems });
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </>
  );
}

function FocalPointProperties({ data, onChange, game }: { data: any; onChange: (updates: any) => void; game: Game }) {
  const [flags, setFlags] = useState(data.flags || []);

  useEffect(() => {
    onChange({ flags });
  }, [flags, onChange]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Name</label>
        <Input
          value={data.label}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ label: newValue });
          }}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
        <Textarea
          value={data.description}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange({ description: newValue });
          }}
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Flags</label>
        <div className="space-y-2">
          {flags.map((flag: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={flag.Name}
                onChange={(e) => {
                  const newFlags = [...flags];
                  newFlags[index] = { ...flag, Name: e.target.value };
                  setFlags(newFlags);
                }}
                placeholder="Flag name"
                className="bg-gray-900 border-gray-700 text-gray-200"
              />
              <Select
                value={flag.Flag.toString()}
                onValueChange={(value) => {
                  const newFlags = [...flags];
                  newFlags[index] = { ...flag, Flag: value === 'true' };
                  setFlags(newFlags);
                }}
              >
                <SelectTrigger className="w-[100px] bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFlags(flags.filter((_, i) => i !== index));
                }}
                className="h-8 w-8"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFlags([...flags, { Name: '', Flag: false }]);
            }}
            className="w-full text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Flag
          </Button>
        </div>
      </div>
    </>
  );
}

function EventProperties({ data, onChange, game }: { data: any; onChange: (updates: any) => void; game: Game }) {
  const [event, setEvent] = useState(() => data.event || { 
    Event: EVENT_TYPES.EXAMINE, 
    Actions: [],
    CustomCommands: []
  });

  const getEventValue = useCallback(() => {
    if (typeof event.Event === 'string' && event.Event.startsWith('custom-')) {
      return event.Event;
    }
    return event.Event?.toString() || '';
  }, [event.Event]);

  // Update local event state when data changes
  useEffect(() => {
    setEvent(data.event || { Event: EVENT_TYPES.EXAMINE, Actions: [], CustomCommands: [] });
  }, [data.event]);

  const updateEvent = useCallback((updates: any) => {
    const updatedEvent = { ...event, ...updates };
    setEvent(updatedEvent);
    onChange({ event: updatedEvent });
  }, [event, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Event Type</label>
        <Select
          value={getEventValue()}
          onValueChange={(value) => updateEvent({
            Event: value.startsWith('custom-') ? value : parseInt(value),
            ItemId: parseInt(value) === EVENT_TYPES.USE_ITEM ? '' : undefined,
            Actions: event.Actions || []
          })}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {/* Standard event types */}
            {Object.entries(EVENT_TYPE_NAMES).map(([value, name]) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
            {/* Custom commands */}
            {game.CustomCommands?.map((command, index) => (
              <SelectItem key={`custom-${index}`} value={`custom-${command.Verb}`}>
                Command: {command.Verb}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(event.Event === EVENT_TYPES.USE_ITEM || event.Event === EVENT_TYPES.USE_WITH_ITEM) && (
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-300">Required Item</label>
          <Select
            value={event.ItemId || ''}
            onValueChange={(value) => updateEvent({ ItemId: value })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
              <SelectValue placeholder="Select required item" />
            </SelectTrigger>
            <SelectContent>
              {game.Items.map((item) => (
                <SelectItem key={item.Id} value={item.Id}>
                  {item.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-300">Actions</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newActions = [...(event.Actions || []), {
                Event: ACTION_TYPES.DISPLAY_MESSAGE,
                Arguments: ['']
              }];

              updateEvent({ Actions: newActions });
            }}
            className="text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Action
          </Button>
        </div>

        {event.Actions?.map((action: any, actionIndex: number) => (
          <div key={actionIndex} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Select
                value={action.Event.toString()}
                onValueChange={(value) => {
                  const newActions = [...event.Actions];
                  newActions[actionIndex] = {
                    Event: parseInt(value),
                    Arguments: ['']
                  };
                  updateEvent({ Actions: newActions });
                }}
              >
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_TYPE_NAMES).map(([value, name]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newActions = event.Actions.filter((_: any, i: number) => i !== actionIndex);
                  updateEvent({ Actions: newActions });
                }}
                className="h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {action.Event === ACTION_TYPES.DISPLAY_MESSAGE && (
              <Textarea
                value={action.Arguments[0] || ''}
                onChange={(e) => {
                  const newActions = [...event.Actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [e.target.value]
                  };
                  updateEvent({ Actions: newActions });
                }}
                placeholder="Enter message text..."
                className="bg-gray-900 border-gray-700 text-sm"
                rows={2}
              />
            )}


            {action.Event === ACTION_TYPES.MOVE_LOCATION && (
              <Select
                value={action.Arguments[0] || ''}
                onValueChange={(locationonId) => {
                  const newActions = [...event.Actions];
                  
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [locationonId]
                  };
                  

                  console.log(newActions[actionIndex])
                  updateEvent({ Actions: newActions });
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select a location to move to" />
                </SelectTrigger>

                <SelectContent>
                  {game.Maps[0].Locations.map((item) => (
                    <SelectItem key={item.LocationId} value={item.LocationId}>
                      {item.LocationId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}


            {action.Event === ACTION_TYPES.ADD_ITEM && (
              <Select
                value={action.Arguments[0] || ''}
                onValueChange={(itemId) => {
                  const newActions = [...event.Actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [itemId]
                  };
                  updateEvent({ Actions: newActions });
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select item to spawn..." />
                </SelectTrigger>
                <SelectContent>
                  {game.Items.map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {action.Event === ACTION_TYPES.REMOVE_ITEM && (
              <Select
                value={action.Arguments[0] || ''}
                onValueChange={(itemId) => {
                  const newActions = [...event.Actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [itemId]
                  };
                  updateEvent({ Actions: newActions });
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select item to remove..." />
                </SelectTrigger>
                <SelectContent>
                  {game.Items.map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {action.Event === ACTION_TYPES.SET_FLAG && (
              <div className="space-y-2">
                <Input
                  value={action.Arguments[0] || ''}
                  onChange={(e) => {
                    const newActions = [...event.Actions];
                    newActions[actionIndex] = {
                      ...action,
                      Arguments: [e.target.value, action.Arguments[1] || 'true']
                    };
                    updateEvent({ Actions: newActions });
                  }}
                  placeholder="Flag name..."
                  className="bg-gray-900 border-gray-700"
                />
                <Select
                  value={action.Arguments[1] || 'true'}
                  onValueChange={(value) => {
                    const newActions = [...event.Actions];
                    newActions[actionIndex] = {
                      ...action,
                      Arguments: [action.Arguments[0] || '', value]
                    };
                    updateEvent({ Actions: newActions });
                  }}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select flag value..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomEventProperties({ data, onChange, game }: { data: any; onChange: (updates: any) => void; game: Game }) {
  const [command, setCommand] = useState(data.command || '');
  const [requiredItems, setRequiredItems] = useState<string[]>(data.requiredItems || []);
  const [requiredFlags, setRequiredFlags] = useState<any[]>(data.requiredFlags || []);
  const [actions, setActions] = useState<any[]>(data.actions || []);

  useEffect(() => {
    onChange({
      command,
      requiredItems,
      requiredFlags,
      actions,
      label: `Command: ${command || 'Unnamed'}`,
      requiresTarget: data.requiresTarget ?? true
    });
  }, [command, requiredItems, requiredFlags, actions, onChange, data.requiresTarget]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Command Verb</label>
        <Input
          value={command || ''}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., kick, push, pull"
          className="bg-gray-800 border-gray-700 text-gray-200"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Command Type</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-200">
            <input
              type="radio"
              checked={data.requiresTarget === true}
              onChange={() => {
                onChange({ requiresTarget: true });
              }}
              className="text-blue-600"
            />
            Requires Target
          </label>
          <label className="flex items-center gap-2 text-gray-200">
            <input
              type="radio"
              checked={data.requiresTarget === false}
              onChange={() => {
                onChange({ requiresTarget: false });
              }}
              className="text-blue-600"
            />
            Global Command
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {data.requiresTarget 
            ? "Players must specify a target (e.g., 'kick door', 'search desk')"
            : "Command works without a target (e.g., 'pray', 'chant', 'meditate')"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Required Items</label>
        <Select
          onValueChange={(value) => {
            if (!requiredItems.includes(value)) {
              setRequiredItems([...requiredItems, value]);
            }
          }}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectValue placeholder="Add required item..." />
          </SelectTrigger>
          <SelectContent>
            {game.Items.map((item) => (
              <SelectItem key={item.Id} value={item.Id}>
                {item.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 space-y-2">
          {requiredItems.map((itemId, index) => {
            const item = game.Items.find(i => i.Id === itemId);
            return item ? (
              <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                <span className="text-gray-200">{item.Name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setRequiredItems(requiredItems.filter((_, i) => i !== index));
                  }}
                  className="h-6 w-6"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">Required Flags</label>
        <div className="space-y-2">
          {requiredFlags.map((flag, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
              <Input
                value={flag.Name}
                onChange={(e) => {
                  const newFlags = [...requiredFlags];
                  newFlags[index] = { ...flag, Name: e.target.value };
                  setRequiredFlags(newFlags);
                }}
                placeholder="Flag name"
                className="bg-gray-900 border-gray-700 text-gray-200"
              />
              <Select
                value={flag.Flag.toString()}
                onValueChange={(value) => {
                  const newFlags = [...requiredFlags];
                  newFlags[index] = { ...flag, Flag: value === 'true' };
                  setRequiredFlags(newFlags);
                }}
              >
                <SelectTrigger className="w-[100px] bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setRequiredFlags(requiredFlags.filter((_, i) => i !== index));
                }}
                className="h-8 w-8"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRequiredFlags([...requiredFlags, { Name: '', Flag: true }]);
            }}
            className="w-full text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Flag
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-300">Actions</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActions([...actions, {
                Event: ACTION_TYPES.DISPLAY_MESSAGE,
                Arguments: ['']
              }]);
            }}
            className="text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Action
          </Button>
        </div>

        {actions.map((action, actionIndex) => (
          <div key={actionIndex} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Select
                value={action.Event.toString()}
                onValueChange={(value) => {
                  const newActions = [...actions];
                  newActions[actionIndex] = {
                    Event: parseInt(value),
                    Arguments: ['']
                  };
                  setActions(newActions);
                }}
              >
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_TYPE_NAMES).map(([value, name]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActions(actions.filter((_, i) => i !== actionIndex));
                }}
                className="h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {action.Event === ACTION_TYPES.DISPLAY_MESSAGE && (
              <Textarea
                value={action.Arguments[0] || ''}
                onChange={(e) => {
                  const newActions = [...actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [e.target.value]
                  };
                  setActions(newActions);
                }}
                placeholder="Enter message text..."
                className="bg-gray-900 border-gray-700 text-sm"
                rows={2}
              />
            )}

            {action.Event === ACTION_TYPES.ADD_ITEM && (
              <Select
                value={action.Arguments[0] || ''}
                onValueChange={(itemId) => {
                  const newActions = [...actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [itemId]
                  };
                  setActions(newActions);
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select item to spawn..." />
                </SelectTrigger>
                <SelectContent>
                  {game.Items.map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {action.Event === ACTION_TYPES.REMOVE_ITEM && (
              <Select
                value={action.Arguments[0] || ''}
                onValueChange={(itemId) => {
                  const newActions = [...actions];
                  newActions[actionIndex] = {
                    ...action,
                    Arguments: [itemId]
                  };
                  setActions(newActions);
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select item to remove..." />
                </SelectTrigger>
                <SelectContent>
                  {game.Items.map((item) => (
                    <SelectItem key={item.Id} value={item.Id}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {action.Event === ACTION_TYPES.SET_FLAG && (
              <div className="space-y-2">
                <Input
                  value={action.Arguments[0] || ''}
                  onChange={(e) => {
                    const newActions = [...actions];
                    newActions[actionIndex] = {
                      ...action,
                      Arguments: [e.target.value, action.Arguments[1] || 'true']
                    };
                    setActions(newActions);
                  }}
                  placeholder="Flag name..."
                  className="bg-gray-900 border-gray-700"
                />
                <Select
                  value={action.Arguments[1] || 'true'}
                  onValueChange={(value) => {
                    const newActions = [...actions];
                    newActions[actionIndex] = {
                      ...action,
                      Arguments: [action.Arguments[0] || '', value]
                    };
                    setActions(newActions);
                  }}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select flag value..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  node: Node;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onChange: (nodeId: string, data: any) => void;
  game: Game;
}

export function PropertiesPanel({ node, onClose, onDelete, onChange, game }: PropertiesPanelProps) {
  const [localData, setLocalData] = useState(node.data);

  useEffect(() => {
    setLocalData(node.data);
  }, [node.data]);

  const handleSave = () => {
    console.log(node.id, localData)
    onChange(node.id, localData);
    onClose();
  };

  const updateLocalData = useCallback((updates: any) => {
    setLocalData(prev => ({ ...prev, ...updates }));
  }, []);

  const getNodeTypeLabel = () => {
    switch (node.type) {
      case 'location':
        return 'Location';
      case 'focalPoint':
        return 'Focal Point';
      case 'event':
        return 'Event';
      case 'customEvent':
        return 'Custom Command';
      default:
        return 'Node';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-gray-200">{getNodeTypeLabel()} Properties</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200"
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {node.type === 'location' && (
          <LocationProperties data={localData} onChange={updateLocalData} game={game} />
        )}

        {node.type === 'focalPoint' && (
          <FocalPointProperties data={localData} onChange={updateLocalData} game={game} />
        )}
        
        {node.type === 'event' && (
          <EventProperties data={localData} onChange={updateLocalData} game={game} />
        )}
        
        {node.type === 'customEvent' && (
          <CustomEventProperties data={localData} onChange={updateLocalData} game={game} />
        )}
      </div>

      <div className="p-6 border-t border-gray-800 bg-gray-900/50">
        <Button
          variant="destructive"
          className="w-full mb-2"
          onClick={() => {
            onDelete(node.id);
            onClose();
          }}
        >
          Delete {getNodeTypeLabel()}
        </Button>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
