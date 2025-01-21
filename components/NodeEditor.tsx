"use client";

import { useState } from 'react';
import { Game, Map, Location, FocalPoint, Event, Action } from '@/lib/types/game';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Box, MapIcon, Eye, Zap, ArrowRight } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface NodeEditorProps {
  game: Game;
  onChange: (game: Game) => void;
}

export function NodeEditor({ game, onChange }: NodeEditorProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {game.Maps.map((map, mapIndex) => (
        <MapNode
          key={mapIndex}
          map={map}
          index={mapIndex}
          game={game}
          onChange={onChange}
          onSelect={setSelectedNode}
          selected={selectedNode?.type === 'map' && selectedNode?.index === mapIndex}
        />
      ))}

      {/* Connection lines would be rendered here */}
    </div>
  );
}

interface MapNodeProps {
  map: Map;
  index: number;
  game: Game;
  onChange: (game: Game) => void;
  onSelect: (node: any) => void;
  selected: boolean;
}

function MapNode({ map, index, game, onChange, onSelect, selected }: MapNodeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `map-${index}`,
    data: {
      type: 'map',
      index,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`absolute p-4 ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect({ type: 'map', index })}
    >
      <Card className="w-64 bg-gray-800 border border-gray-700">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-200">{map.Name}</h3>
          </div>
          
          <div className="space-y-2">
            {map.Locations.map((location, locationIndex) => (
              <LocationNode
                key={locationIndex}
                location={location}
                mapIndex={index}
                locationIndex={locationIndex}
                game={game}
                onChange={onChange}
                onSelect={onSelect}
                selected={selectedNode?.type === 'location' && 
                         selectedNode?.mapIndex === index && 
                         selectedNode?.locationIndex === locationIndex}
              />
            ))}
          </div>

          <Button
            onClick={() => {
              const newMap = { ...map };
              newMap.Locations.push({
                Name: 'New Location',
                Description: 'Location description',
                FoculPoints: [],
                Items: []
              });
              const newMaps = [...game.Maps];
              newMaps[index] = newMap;
              onChange({ ...game, Maps: newMaps });
            }}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface LocationNodeProps {
  location: Location;
  mapIndex: number;
  locationIndex: number;
  game: Game;
  onChange: (game: Game) => void;
  onSelect: (node: any) => void;
  selected: boolean;
}

function LocationNode({ location, mapIndex, locationIndex, game, onChange, onSelect, selected }: LocationNodeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `location-${mapIndex}-${locationIndex}`,
    data: {
      type: 'location',
      mapIndex,
      locationIndex,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect({ type: 'location', mapIndex, locationIndex })}
    >
      <Card className="bg-gray-700/50 border border-gray-600/50">
        <div className="p-3">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-medium text-gray-200">{location.Name}</h4>
          </div>
          
          <div className="mt-2 space-y-1">
            {location.FoculPoints.map((focalPoint, fpIndex) => (
              <FocalPointNode
                key={fpIndex}
                focalPoint={focalPoint}
                mapIndex={mapIndex}
                locationIndex={locationIndex}
                fpIndex={fpIndex}
                game={game}
                onChange={onChange}
                onSelect={onSelect}
                selected={selectedNode?.type === 'focalPoint' && 
                         selectedNode?.mapIndex === mapIndex && 
                         selectedNode?.locationIndex === locationIndex &&
                         selectedNode?.fpIndex === fpIndex}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface FocalPointNodeProps {
  focalPoint: FocalPoint;
  mapIndex: number;
  locationIndex: number;
  fpIndex: number;
  game: Game;
  onChange: (game: Game) => void;
  onSelect: (node: any) => void;
  selected: boolean;
}

function FocalPointNode({ focalPoint, mapIndex, locationIndex, fpIndex, game, onChange, onSelect, selected }: FocalPointNodeProps) {
  return (
    <div
      className={`relative ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect({ type: 'focalPoint', mapIndex, locationIndex, fpIndex })}
    >
      <Card className="bg-gray-600/50 border border-gray-500/50">
        <div className="p-2">
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-purple-400" />
            <h5 className="text-xs font-medium text-gray-300">{focalPoint.Name}</h5>
          </div>
          
          <div className="mt-1 space-y-1">
            {focalPoint.Events.map((event, eventIndex) => (
              <EventNode
                key={eventIndex}
                event={event}
                mapIndex={mapIndex}
                locationIndex={locationIndex}
                fpIndex={fpIndex}
                eventIndex={eventIndex}
                game={game}
                onChange={onChange}
                onSelect={onSelect}
                selected={selectedNode?.type === 'event' && 
                         selectedNode?.mapIndex === mapIndex && 
                         selectedNode?.locationIndex === locationIndex &&
                         selectedNode?.fpIndex === fpIndex &&
                         selectedNode?.eventIndex === eventIndex}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface EventNodeProps {
  event: Event;
  mapIndex: number;
  locationIndex: number;
  fpIndex: number;
  eventIndex: number;
  game: Game;
  onChange: (game: Game) => void;
  onSelect: (node: any) => void;
  selected: boolean;
}

function EventNode({ event, mapIndex, locationIndex, fpIndex, eventIndex, game, onChange, onSelect, selected }: EventNodeProps) {
  return (
    <div
      className={`relative ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect({ type: 'event', mapIndex, locationIndex, fpIndex, eventIndex })}
    >
      <Card className="bg-gray-500/50 border border-gray-400/50">
        <div className="p-1">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <h6 className="text-xs font-medium text-gray-300">Event {eventIndex + 1}</h6>
          </div>
        </div>
      </Card>
    </div>
  );
}