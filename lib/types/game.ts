import { z } from 'zod';

// Game engine types
export interface Item {
  Id: string;
  Name: string;
  Description: string;
}

export interface Action {
  Event: number; // 0 = Display message, 1 = Add item, 2 = Remove item, 3 = Move to location, 4 = Set flag
  Arguments: string[];
}

export const EVENT_TYPES = {
  EXAMINE: 1,
  INTERACT: 2,
  USE_ITEM: 3,
  USE_WITH_ITEM: 4
} as const;

export const ACTION_TYPES = {
  DISPLAY_MESSAGE: 0,
  ADD_ITEM: 1,
  REMOVE_ITEM: 2,
  MOVE_LOCATION: 3,
  SET_FLAG: 4
} as const;

export const EVENT_TYPE_NAMES: Record<number, string> = {
  [EVENT_TYPES.EXAMINE]: "When Examined",
  [EVENT_TYPES.INTERACT]: "When Interacted With",
  [EVENT_TYPES.USE_ITEM]: "When Used On This",
  [EVENT_TYPES.USE_WITH_ITEM]: "When Used With Another Item"
};

export const ACTION_TYPE_NAMES: Record<number, string> = {
  [ACTION_TYPES.DISPLAY_MESSAGE]: "Display Message",
  [ACTION_TYPES.ADD_ITEM]: "Add Item to Scene",
  [ACTION_TYPES.REMOVE_ITEM]: "Remove Item",
  [ACTION_TYPES.MOVE_LOCATION]: "Move to Location",
  [ACTION_TYPES.SET_FLAG]: "Set Flag"
};

export interface Event {
  Event: number | string; // number for standard events, string for custom commands (e.g., "kick", "search")
  ItemId?: string; // Required for USE events to specify which item triggers this event
  Actions: Action[];
  RequiresTarget?: boolean; // For custom command events
  RequiredItems?: string[]; // For custom command events
  RequiredFlags?: Flag[]; // For custom command events
}

export interface Flag {
  Flag: boolean;
  Name: string;
}

export interface CommandAlias {
  Verb: string;      // The custom verb (e.g., "kick", "lick", "throw")
  RequiresTarget: boolean; // Whether this command needs a target object
  Actions: Action[]; // Direct actions to execute when this command is used
  RequiredItems?: string[]; // Optional array of item IDs required to use this command
  RequiredFlags?: Flag[]; // Optional flags that must be set to use this command
}

export interface FocalPoint {
  Name: string;
  Description: string;
  Events: Event[];
  Flags: Flag[];
}

export interface Location {
  LocationId: string;
  Name: string;
  Description: string;
  Items: string[];  // Array of item IDs that are present in this location
  FoculPoints: FocalPoint[];
}

export interface Map {
  Name: string;
  Description: string;
  Locations: Location[];
  Introduction: string;
  Layout?: {
    Nodes: {
      id: string;
      position: {
        x: number;
        y: number;
      };
    }[];
  };
}

export interface Game {
  Details: GameDetails,
  Items: Item[];
  Maps: Map[];
  CustomCommands?: CommandAlias[];
}

export interface GameDetails {
  Name: string,
  Description: string,
  SpawnId: string
}

export interface GameState {
  currentMap: number;
  currentLocation: Location;
  inventory: string[];
  flags: Record<string, boolean>;
  spawnedItems: Record<string, boolean>; // Track which items are spawned in the world
}
