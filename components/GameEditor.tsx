"use client";

import { useState, useCallback, useMemo } from 'react';
import { Game, Map, Location, FocalPoint, Item, Event, Action } from '@/lib/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box, MapIcon, Eye, Zap, Settings, ChevronRight, Plus, Settings2, Command } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';
import { isNode } from 'reactflow';

const FlowEditor = dynamic(
  () => import('@/components/FlowEditor').then((mod) => mod.FlowEditor),
  { ssr: false }
);

interface GameEditorProps {
  game: Game;
  onChange: (game: Game) => void;
}

export function GameEditor({ game, onChange }: GameEditorProps) {
  const [activeMap, setActiveMap] = useState<number | null>(game.Maps.length > 0 ? 0 : null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const gameContext = useMemo(() => ({ ...game }), [game]);
  var [isGameExpaned, setGameExpaned] = useState<boolean>(false);
  var [isNodesExpanded, setNodeExpanded] = useState<boolean>(false);

  const addNewMap = useCallback(() => {
    const newMap: Map = {
      Name: 'New Map',
      Description: 'Map description',
      Introduction: 'Map introduction',
      Locations: []
    };
    onChange({ ...game, Maps: [...game.Maps, newMap] });
    setActiveMap(game.Maps.length);
  }, [game, onChange]);

  const updateMapProperties = useCallback((mapIndex: number, updates: Partial<Map>) => {
    const updatedMaps = [...game.Maps];
    updatedMaps[mapIndex] = { ...updatedMaps[mapIndex], ...updates };
    onChange({ ...game, Maps: updatedMaps });
  }, [game, onChange]);

  const handleComponentClick = useCallback((type: string) => {
    if (activeMap === null) return;

    switch (type) {
      case 'location':
        const locationX = selectedNode ? selectedNode.position.x + 800 : game.Maps[activeMap].Locations.length * 800;
        const locationY = selectedNode ? selectedNode.position.y : game.Maps[activeMap].Locations.length * 600;
        const locationId = `location-${game.Maps[activeMap].Locations.length}`;

        // Save initial position in map layout
        const updatedMaps = [...game.Maps];
        if (!updatedMaps[activeMap].Layout) {
          updatedMaps[activeMap].Layout = { Nodes: [] };
        }
        updatedMaps[activeMap].Layout.Nodes.push({
          id: locationId,
          position: { x: locationX, y: locationY }
        });

        const newLocation: Location = {
          Name: 'New Location',
          Description: 'Location description',
          FoculPoints: [], // Note: Typo in the type, but keeping for consistency
          Items: []
        };
        updatedMaps[activeMap].Locations.push(newLocation);
        onChange({ ...game, Maps: updatedMaps });

        const newLocationIndex = updatedMaps[activeMap].Locations.length - 1;

        setSelectedNode({
          id: locationId,
          type: 'location',
          position: { x: locationX, y: locationY },
          data: {
            nodeType: 'location',
            locationIndex: newLocationIndex,
            label: newLocation.Name,
            description: newLocation.Description,
            items: []
          }
        });
        break;

      case 'focalPoint':
        if (!selectedNode || selectedNode.type !== 'location') {
          toast.error('Select a location first');
          return;
        }

        const fpX = selectedNode.position.x + 800;
        const fpY = selectedNode.position.y;

        const newFocalPoint: FocalPoint = {
          Name: 'New Focal Point',
          Description: 'Focal point description',
          Events: [],
          Flags: []
        };
        const locationIndex = selectedNode.data.locationIndex;
        const mapsWithNewFP = [...game.Maps];
        mapsWithNewFP[activeMap].Locations[locationIndex].FoculPoints.push(newFocalPoint);
        const fpIndex = mapsWithNewFP[activeMap].Locations[locationIndex].FoculPoints.length - 1;

        // Create the new node first
        setSelectedNode({
          id: `fp-${locationIndex}-${fpIndex}`,
          type: 'focalPoint',
          position: { x: fpX, y: fpY },
          data: {
            nodeType: 'focalPoint',
            locationIndex,
            fpIndex,
            label: newFocalPoint.Name,
            description: newFocalPoint.Description
          }
        });

        // Then update the game state
        onChange({ ...game, Maps: mapsWithNewFP });
        break;

      case 'event':
        if (!selectedNode || selectedNode.type !== 'focalPoint') {
          toast.error('Select a focal point first');
          return;
        }

        const eventX = selectedNode.position.x + 800;
        const eventY = selectedNode.position.y;

        const newEvent: Event = {
          Event: 1,
          Actions: []
        };

        const { locationIndex: eventLocationIndex, fpIndex: eventFpIndex } = selectedNode.data;

        const mapsWithNewEvent = [...game.Maps];
        mapsWithNewEvent[activeMap].Locations[eventLocationIndex].FoculPoints[eventFpIndex].Events.push(newEvent);
        const eventIndex = mapsWithNewEvent[activeMap].Locations[eventLocationIndex].FoculPoints[eventFpIndex].Events.length - 1;

        // Create the new node first
        setSelectedNode({
          id: `event-${eventLocationIndex}-${eventFpIndex}-${eventIndex}`,
          type: 'event',
          position: { x: eventX, y: eventY },
          data: {
            label: `Event ${eventIndex + 1}`,
            event: newEvent,
            nodeType: 'event',
            locationIndex: eventLocationIndex,
            fpIndex: eventFpIndex,
            eventIndex
          }
        });

        // Then update the game state
        onChange({ ...game, Maps: mapsWithNewEvent });
        break;

      case 'customEvent':
        if (!selectedNode || selectedNode.type !== 'focalPoint') {
          toast.error('Select a focal point first');
          return;
        }

        const customEventX = selectedNode.position.x + 800;
        const customEventY = selectedNode.position.y;

        const { locationIndex: customEventLocationIndex, fpIndex: customEventFpIndex } = selectedNode.data;

        setSelectedNode({
          id: `custom-event-${customEventLocationIndex}-${customEventFpIndex}-${Date.now()}`,
          type: 'customEvent',
          position: { x: customEventX, y: customEventY },
          data: {
            label: 'New Custom Command',
            command: '',
            requiredItems: [],
            requiredFlags: [],
            actions: [],
            nodeType: 'customEvent',
            locationIndex: customEventLocationIndex,
            fpIndex: customEventFpIndex
          }
        });
        break;
    }
  }, [activeMap, selectedNode, game, onChange]);

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden">
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800" onClick={() => setGameExpaned(!isGameExpaned)}>
          <h3 className="text-lg font-semibold text-gray-300">Game Details {isGameExpaned && (<span>&lsaquo;</span>)}  {!isGameExpaned && (<span>&rsaquo;</span>)}</h3>
          <p className="text-sm text-gray-400 mt-1">Mange the details of your game</p>
        </div>

        {isGameExpaned && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Game Name</label>

              <Input
                value={game.Details.Name}
                onChange={(e) => {
                  const newValue = e.target.value;

                  var newDetails = game.Details;
                  newDetails.Name = newValue;

                  onChange({ ...game, Details: newDetails });
                }}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
              <Textarea
                value={game.Details.Description}
                onChange={(e) => {
                  const newValue = e.target.value;

                  var newDetails = game.Details;
                  newDetails.Description = newValue;

                  onChange({ ...game, Details: newDetails });
                }}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Spawn Location</label>

              <Input
                value={game.Details.SpawnId}
                onChange={(e) => {
                  const newValue = e.target.value;

                  var newDetails = game.Details;
                  newDetails.SpawnId = newValue;

                  onChange({ ...game, Details: newDetails });
                }}
                className="bg-gray-800 border-gray-700 text-gray-200" ></Input>
            </div>
          </div>
        )}


        <div className="p-4 border-b border-gray-800" onClick={() => setNodeExpanded(!isNodesExpanded)}>
          <h3 className="text-lg font-semibold text-gray-300">Components {isNodesExpanded && (<span>&lsaquo;</span>)}  {!isNodesExpanded && (<span>&rsaquo;</span>)}</h3>
          <p className="text-sm text-gray-400 mt-1">Drag components to the canvas</p>
        </div>

        {isNodesExpanded && (<>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <ComponentButton
              icon={<Box className="w-4 h-4" />}
              label="Location"
              description="Add a new location to your map"
              onClick={() => handleComponentClick('location')}
              color="text-emerald-500"
            />
            <ComponentButton
              icon={<Eye className="w-4 h-4" />}
              label="Focal Point"
              description="Add an interactive point to a location"
              onClick={() => handleComponentClick('focalPoint')}
              color="text-purple-500"
            />
            <ComponentButton
              icon={<Zap className="w-4 h-4" />}
              label="Event"
              description="Add an event to a focal point"
              onClick={() => handleComponentClick('event')}
              color="text-yellow-500"
            />
          </div>
        </>)}
      </div>

      <div className="flex-1 bg-gray-950 flex flex-col relative">
        {game.Maps.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Maps Created</h3>
              <p className="text-gray-500 mb-4">Create your first map to get started</p>
              <Button
                onClick={addNewMap}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Map
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeMap?.toString()} onValueChange={(value) => setActiveMap(parseInt(value))}>
            <div className="border-b border-gray-800 bg-gray-900/50">
              <div className="px-2 flex items-center">
                <TabsList className="bg-gray-900/50 border border-gray-800">
                  {game.Maps.map((map, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      {map.Name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex items-center gap-2 ml-2">
                  {activeMap !== null && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 bg-gray-900 border-gray-800">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-300">
                              Map Name
                            </label>
                            <Input
                              value={game.Maps[activeMap].Name}
                              onChange={(e) => updateMapProperties(activeMap, { Name: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-gray-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-300">
                              Description
                            </label>
                            <Textarea
                              value={game.Maps[activeMap].Description}
                              onChange={(e) => updateMapProperties(activeMap, { Description: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-gray-200"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-300">
                              Introduction
                            </label>
                            <Textarea
                              value={game.Maps[activeMap].Introduction}
                              onChange={(e) => updateMapProperties(activeMap, { Introduction: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-gray-200"
                              rows={3}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button onClick={addNewMap} variant="ghost" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            {activeMap !== null && (
              <FlowEditor
                map={game.Maps[activeMap]}
                onChange={onChange}
                game={gameContext}
                mapIndex={activeMap}
                onNodeSelect={setSelectedNode}
                selectedNode={selectedNode}
              />
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
}

interface ComponentButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

function ComponentButton({ icon, label, description, onClick, color }: ComponentButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className={`${color} mt-0.5`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-200 mb-1">{label}</h4>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </button>
  );
}