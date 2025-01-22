"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Map, Location, FocalPoint, Event } from '@/lib/types/game';
import { LocationNode } from '@/components/nodes/LocationNode';
import { FocalPointNode } from '@/components/nodes/FocalPointNode';
import { EventNode } from '@/components/nodes/EventNode';
import { CustomEventNode } from '@/components/nodes/CustomEventNode';
import { toast } from 'sonner';
import { ConnectionLine } from '@/components/nodes/ConnectionLine';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { Game } from '@/lib/types/game';

interface FlowEditorProps {
  map: Map;
  game: Game;
  onChange: (game: any) => void;
  mapIndex: number;
  onNodeSelect: (node: Node | null) => void;
  selectedNode: Node | null;
}

function Flow({ map, game, onChange, mapIndex, onNodeSelect, selectedNode }: FlowEditorProps) {
  const nodeTypes = useMemo(() => ({
    'location': LocationNode,
    'focalPoint': FocalPointNode,
    'event': EventNode,
    'customEvent': CustomEventNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; parentId?: string }>>(
    map.Layout?.Nodes?.reduce((acc, node) => ({
      ...acc,
      [node.id]: node.position
    }), {}) || {}
  );
  const gameContext = useMemo(() => ({ ...game }), [game]);
  const { setCenter } = useReactFlow();

  // Update nodes when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      // Center the view on the new node with some zoom
      setCenter(selectedNode.position.x, selectedNode.position.y, { zoom: 0.75, duration: 800 });
      
      setNodes(nds => {
        // Remove any existing node with the same ID
        const filteredNodes = nds.filter(n => n.id !== selectedNode.id);
        // Add the new node
        return [...filteredNodes, selectedNode];
      });
    }
  }, [selectedNode, setNodes, setCenter]);
  const { project } = useReactFlow();

  const updateMap = useCallback((updatedMap: Partial<Map>) => {
    onChange((prevGame: any) => {
      const newMaps = [...prevGame.Maps];
      newMaps[mapIndex] = { ...newMaps[mapIndex], ...updatedMap };
      return { ...prevGame, Maps: newMaps };
    });
  }, [onChange, mapIndex]);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedMap = { ...map };
    const { nodeType, locationIndex, fpIndex, eventIndex, aliasIndex } = node.data;

    switch (nodeType) {
      case 'location':
        updatedMap.Locations = updatedMap.Locations.filter((_, i) => i !== locationIndex);
        break;
      case 'focalPoint':
        updatedMap.Locations[locationIndex].FoculPoints = 
          updatedMap.Locations[locationIndex].FoculPoints.filter((_, i) => i !== fpIndex);
        break;
      case 'event':
        updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events = 
          updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events.filter((_, i) => i !== eventIndex);
        break;
      case 'customEvent':
        const focalPoint = updatedMap.Locations[locationIndex].FoculPoints[fpIndex];
        if (focalPoint && typeof aliasIndex === 'number') {
          focalPoint.Aliases = focalPoint.Aliases?.filter((_, i) => i !== aliasIndex) || [];
        }
        break;
    }

    // Remove the node and its edges
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    // Clear selection if the deleted node was selected
    if (selectedNode?.id === nodeId) {
      onNodeSelect(null);
    }

    updateMap(updatedMap);
  }, [nodes, map, updateMap, selectedNode, onNodeSelect]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    if (node.type === 'location') {
      setExpandedLocations(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    }
    onNodeSelect(node);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const newPositions = {
      ...nodePositions,
      [node.id]: { 
        ...node.position,
        parentId: edges.find(e => e.target === node.id)?.source 
      }
    };
    
    setNodePositions(newPositions);

    // Save positions to map layout
    const updatedLayout = {
      Nodes: Object.entries(newPositions).map(([id, pos]) => ({
        id,
        position: {
          x: pos.x,
          y: pos.y
        }
      }))
    };

    updateMap({
      Layout: updatedLayout
    });
  }, [edges, nodePositions, updateMap]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, ...newData };
          // Handle event actions
          if (newData.event?.Actions) {
            updatedData.event.Actions = newData.event.Actions.map((action: any) => {
              if (action.Event === 1) { // ADD_ITEM
                const item = game.Items.find(i => i.Id === action.Arguments[0]);
                if (item) {
                  return { ...action, itemName: item.Name };
                }
              }
              return action;
            });
          }
          // Handle custom command actions
          if (newData.actions) {
            updatedData.actions = newData.actions.map((action: any) => {
              if (action.Event === 1) { // ADD_ITEM
                const item = game.Items.find(i => i.Id === action.Arguments[0]);
                if (item) {
                  return { ...action, itemName: item.Name };
                }
              }
              return action;
            });
          }
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedMap = { ...map };
    const { nodeType, locationIndex, fpIndex, eventIndex, aliasIndex } = node.data;

    switch (nodeType) {
      case 'customEvent':
        if (!updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases) {
          updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases = [];
        }
        const aliases = updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases;
        
        const newAlias = {
          Verb: newData.command || 'new_command',
          RequiresTarget: newData.requiresTarget ?? true,
          Actions: newData.actions || [],
          RequiredItems: newData.requiredItems || [],
          RequiredFlags: newData.requiredFlags || []
        };
        
        if (typeof aliasIndex === 'number') {
          aliases[aliasIndex] = newAlias;
        } else {
          aliases.push(newAlias);
        }
        break;

      case 'location':
        if (!updatedMap.Locations) {
          updatedMap.Locations = [];
        }

        console.log("New Data", newData);

        updatedMap.Locations[locationIndex] = {
          ...updatedMap.Locations[locationIndex],
          Name: newData.label,
          Description: newData.description,
          LocationId: newData.locationId,
          Items: newData.items || []
        };

        console.log("New data - after",  updatedMap.Locations[locationIndex])
        break;
      case 'focalPoint':
        if (!updatedMap.Locations?.[locationIndex]?.FoculPoints) {
          return;
        }
        updatedMap.Locations[locationIndex].FoculPoints[fpIndex] = {
          ...updatedMap.Locations[locationIndex].FoculPoints[fpIndex],
          Name: newData.label,
          Description: newData.description,
          Flags: newData.flags || []
        };
        break;
      case 'event':
        if (!updatedMap.Locations?.[locationIndex]?.FoculPoints?.[fpIndex]?.Events) {
          return;
        }
        // Update event data
        updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events[eventIndex] = {
          ...updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events[eventIndex],
          ...newData.event
        };
        break;
    }

    updateMap(updatedMap);
  }, [nodes, map, updateMap]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const visibleNodes = new Set<string>();

    // Create location nodes
    map?.Locations?.forEach((location, locationIndex) => {
      const locationNodeId = `location-${locationIndex}`;
      visibleNodes.add(locationNodeId);
      const savedLocPosition = nodePositions[locationNodeId];
      const locPosition = savedLocPosition || { 
        x: locationIndex * 800, 
        y: locationIndex * 600 
      };

      const locationNode: Node = {
        id: locationNodeId,
        type: 'location',
        position: locPosition,
        data: { 
          locationId: location.LocationId,
          label: location.Name,
          expanded: expandedLocations.has(locationNodeId),
          onToggleExpand: () => {
            setExpandedLocations(prev => {
              const next = new Set(prev);
              if (next.has(locationNodeId)) {
                next.delete(locationNodeId);
              } else {
                next.add(locationNodeId);
              }
              return next;
            });
          },
          description: location.Description,
          nodeType: 'location',
          locationIndex,
          items: location.Items || []
        }
      };
      newNodes.push(locationNode);

      // Create focal point nodes
      if (expandedLocations.has(locationNodeId)) {
        location.FoculPoints?.forEach((focalPoint, fpIndex) => {
        const fpNodeId = `fp-${locationIndex}-${fpIndex}`;
        visibleNodes.add(fpNodeId);
        const savedFPPosition = nodePositions[fpNodeId];
        const fpPosition = savedFPPosition || {
          x: locPosition.x + 800,
          y: locPosition.y + fpIndex * 300
        };

        const fpNode: Node = {
          id: fpNodeId,
          type: 'focalPoint',
          position: fpPosition,
          data: { 
            label: focalPoint.Name,
            description: focalPoint.Description,
            flags: focalPoint.Flags || [],
            nodeType: 'focalPoint',
            locationIndex,
            fpIndex
          }
        };
        newNodes.push(fpNode);

        // Connect location to focal point
        newEdges.push({
          id: `e-${locationNodeId}-${fpNodeId}`,
          source: locationNodeId,
          target: fpNodeId,
          type: 'smoothstep'
        });

        // Create event nodes
        focalPoint.Events?.forEach((event, eventIndex) => {
          const eventNodeId = `event-${locationIndex}-${fpIndex}-${eventIndex}`;
          visibleNodes.add(eventNodeId);
          const savedEventPosition = nodePositions[eventNodeId];
          const eventPosition = savedEventPosition || {
            x: fpPosition.x + 800,
            y: fpPosition.y + eventIndex * 250
          };

          const eventNode: Node = {
            id: eventNodeId,
            type: 'event',
            position: eventPosition,
            data: { 
              label: `Event ${eventIndex + 1}`,
              event,
              nodeType: 'event',
              locationIndex,
              fpIndex,
              eventIndex
            }
          };
          newNodes.push(eventNode);

          // Connect focal point to event
          newEdges.push({
            id: `e-${fpNodeId}-${eventNodeId}`,
            source: fpNodeId,
            target: eventNodeId,
            type: 'smoothstep'
          });
        });

        // Create custom event nodes
        focalPoint.Aliases?.forEach((alias, aliasIndex) => {
          const customEventNodeId = `custom-event-${locationIndex}-${fpIndex}-${aliasIndex}`;
          visibleNodes.add(customEventNodeId);
          const savedCustomEventPosition = nodePositions[customEventNodeId];
          const customEventPosition = savedCustomEventPosition || {
            x: fpPosition.x + 800,
            y: fpPosition.y + (focalPoint.Events?.length || 0) * 250 + aliasIndex * 250
          };

          const customEventNode: Node = {
            id: customEventNodeId,
            type: 'customEvent',
            position: customEventPosition,
            data: {
              label: `Command: ${alias.Verb}`,
              command: alias.Verb,
              actions: alias.Actions,
              requiredItems: alias.RequiredItems || [],
              requiredFlags: alias.RequiredFlags || [],
              nodeType: 'customEvent',
              locationIndex,
              fpIndex,
              aliasIndex
            }
          };
          newNodes.push(customEventNode);

          // Connect focal point to custom event
          newEdges.push({
            id: `e-${fpNodeId}-${customEventNodeId}`,
            source: fpNodeId,
            target: customEventNodeId,
            type: 'smoothstep'
          });
        });
      });
      }
    });

    // Only show nodes that should be visible
    setNodes(newNodes.filter(node => visibleNodes.has(node.id)));
    setEdges(prev => {
      // Keep only edges that still have valid source and target nodes
      const validEdges = prev.filter(edge => 
        visibleNodes.has(edge.source) && visibleNodes.has(edge.target)
      );
      // Add new edges that don't exist yet
      const existingEdgeIds = new Set(validEdges.map(e => e.id));
      const edgesToAdd = newEdges.filter(e => !existingEdgeIds.has(e.id));
      return [...validEdges, ...edgesToAdd];
    });
  }, [map, setNodes, setEdges, nodePositions, expandedLocations]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (sourceNode?.type === 'focalPoint' && (targetNode?.type === 'event' || targetNode?.type === 'customEvent')) {
        const locationIndex = sourceNode.data.locationIndex;
        const fpIndex = sourceNode.data.fpIndex;
        const eventNode = nodes.find(n => n.id === targetNode?.id);
        if (!eventNode) return;

        const updatedMap = { ...map };

        if (targetNode.type === 'event') {
          // Handle regular event connection
          if (eventNode.data.locationIndex !== undefined) {
            const oldLocationIndex = eventNode.data.locationIndex;
            const oldFpIndex = eventNode.data.fpIndex;
            const oldEventIndex = eventNode.data.eventIndex;
            
            if (!updatedMap.Locations?.[oldLocationIndex]?.FoculPoints?.[oldFpIndex]?.Events) {
              return;
            }
            
            updatedMap.Locations[oldLocationIndex].FoculPoints[oldFpIndex].Events = 
              updatedMap.Locations[oldLocationIndex].FoculPoints[oldFpIndex].Events.filter(
                (_: any, i: number) => i !== oldEventIndex
              );
          }

          if (!updatedMap.Locations?.[locationIndex]?.FoculPoints?.[fpIndex]?.Events) {
            return;
          }
          // Add event to the new focal point
          const newEvent = { ...targetNode.data.event };
          updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events.push(newEvent);
          const eventIndex = updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Events.length - 1;

          // Update node data
          setNodes(nds => nds.map(node => {
            if (node.id === targetNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  locationIndex,
                  fpIndex,
                  eventIndex
                }
              };
            }
            return node;
          }));
        } else if (targetNode.type === 'customEvent') {
          // Handle custom event connection
          if (!updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases) {
            updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases = [];
          }
          
          // Add custom event as an alias
          const newAlias = {
            Verb: targetNode.data.command || 'new_command',
            Actions: targetNode.data.actions || [],
            RequiredItems: targetNode.data.requiredItems || [],
            RequiredFlags: targetNode.data.requiredFlags || []
          };
          
          // Ensure all required arrays exist
          if (!updatedMap.Locations) {
            updatedMap.Locations = [];
          }
          if (!updatedMap.Locations[locationIndex]) {
            updatedMap.Locations[locationIndex] = {
              Name: '',
              Description: '',
              Items: [],
              FoculPoints: []
            };
          }
          if (!updatedMap.Locations[locationIndex].FoculPoints) {
            updatedMap.Locations[locationIndex].FoculPoints = [];
          }
          if (!updatedMap.Locations[locationIndex].FoculPoints[fpIndex]) {
            updatedMap.Locations[locationIndex].FoculPoints[fpIndex] = {
              Name: '',
              Description: '',
              Events: [],
              Flags: []
            };
          }
          if (!updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases) {
            updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases = [];
          }
          
          updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases.push(newAlias);
          
          // Update node data
          setNodes(nds => nds.map(node => {
            if (node.id === targetNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  locationIndex,
                  fpIndex,
                  aliasIndex: updatedMap.Locations[locationIndex].FoculPoints[fpIndex].Aliases.length - 1
                }
              };
            }
            return node;
          }));
        }

        updateMap(updatedMap);
        setEdges(eds => addEdge(params, eds));
      } else {
        toast.error('Events and custom events can only be connected to focal points');
      }
    },
    [setEdges, nodes, map, updateMap, setNodes]
  );

  console.log("Selected node ", selectedNode);
  return (
    <div className="flex-1 h-[calc(100vh-130px)]">
      <ReactFlow
        nodesDraggable={true}
        nodesConnectable={true}
        onPaneClick={onPaneClick}
        selectionMode="none"
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        nodes={nodes.map(node => ({
          ...node,
          className: `${node.type === 'location' ? 'location-node' : ''}`,
          data: {
            ...node.data,
            onDelete: () => deleteNode(node.id),
            onClick: () => onNodeSelect(node),
            selected: selectedNode?.id === node.id,
            locationIndex: node.data.locationIndex
          }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode="loose"
        connectionRadius={40}
        snapToGrid={true}
        snapGrid={[20, 20]}
        connectionLineComponent={ConnectionLine}
        className="bg-gray-950"
        fitView
      >
        <Background color="#374151" gap={16} />
        <Controls />
        <MiniMap
          style={{ width: 200, height: 150 }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'location':
                return '#10B981';
              case 'focalPoint':
                return '#8B5CF6';
              case 'event':
                return '#F59E0B';
              default:
                return '#6B7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="bg-gray-900 border-gray-800"
        />
      </ReactFlow>
      <div className={`absolute top-0 right-0 w-72 h-full bg-gray-900 border-l border-gray-800 transition-all duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onClose={() => onNodeSelect(null)}
            onDelete={deleteNode}
            onChange={updateNodeData}
            game={gameContext}
          />
        )}
      </div>
    </div>
  );
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
