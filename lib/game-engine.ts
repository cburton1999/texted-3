import { Game, GameState, Action, EVENT_TYPES, CommandAlias } from './types/game';

export class GameEngine {
  public game: Game;
  private state: GameState;

  constructor(game: Game) {
    this.game = game;
    this.state = {
      currentMap: 0,
      currentLocation: 0,
      inventory: [],
      flags: {},
      spawnedItems: this.initializeSpawnedItems(),
    };
  }

  private initializeSpawnedItems(): Record<string, boolean> {
    const spawnedItems: Record<string, boolean> = {};
    
    // Initialize items from all locations
    this.game.Maps.forEach(map => {
      map.Locations.forEach(location => {
        location.Items?.forEach(itemId => {
          spawnedItems[itemId] = true;
        });
      });
    });
    
    return spawnedItems;
  }

  public getCurrentLocation() {
    const location = this.game.Maps[this.state.currentMap].Locations[this.state.currentLocation];
    return {
      ...location,
      Items: location.Items?.filter(itemId => this.state.spawnedItems[itemId]) || []
    };
  }

  public getInventory() {
    return this.state.inventory.map(itemId => 
      this.game.Items.find(item => item.Id === itemId)
    ).filter(Boolean);
  }

  public getSpawnedItems() {
    const location = this.getCurrentLocation();
    return (location.Items || [])
      .filter(itemId => this.state.spawnedItems[itemId])
      .map(itemId => this.game.Items.find(item => item.Id === itemId))
      .filter(Boolean);
  }

  public getFocalPoints() {
    const location = this.getCurrentLocation();
    return location.FoculPoints.filter(point => {
      // If there are no flags, the focal point is always visible
      if (!point.Flags || point.Flags.length === 0) {
        return true;
      }
      
      // All flags must match their expected values exactly
      return point.Flags.every(flag => 
        (this.state.flags[flag.Name] || false) === flag.Flag
      );
    });
  }

  public handleCommand(command: string): string[] {
    const messages: string[] = [];
    const normalizedCommand = command.toLowerCase().trim();
    const words = normalizedCommand.split(/\s+/);
    const verb = words[0];
    const target = words.slice(1).join(' ').toLowerCase().trim();

    // Check for standard commands
    if (this.isStandardCommand(verb)) {
      return this.executeStandardCommand(verb, target, normalizedCommand);
    }

    // Check for custom commands on focal points
    const focalPoints = this.getFocalPoints();
    for (const point of focalPoints) {
      const pointName = point.Name.toLowerCase();

      // Look for custom command events
      const customEvents = point.Events.filter(event => 
        typeof event.Event === 'string' && event.Event.startsWith('custom-') && 
        event.Event.replace('custom-', '').toLowerCase() === verb
      );

      for (const event of customEvents) {
        const requiresTarget = event.RequiresTarget ?? true;

        // For targeted commands, ensure the target matches this focal point
        if (requiresTarget) {
          if (target && target.includes(pointName.toLowerCase())) {
            return this.executeCustomCommand(event);
          }
        } else {
          // For non-targeted commands, execute if no target was specified
          if (!target) {
            return this.executeCustomCommand(event);
          }
        }
      }
    }

    // Check for global custom commands that don't require targets
    if (this.game.CustomCommands) {
      const customCommand = this.game.CustomCommands.find(cmd => {
        const verbMatches = cmd.Verb.toLowerCase() === verb;
        
        // For commands that require targets, ensure a target was provided
        if (cmd.RequiresTarget) {
          return verbMatches && target.length > 0;
        }
        
        // For global commands, ensure no target was provided
        return verbMatches && !target;
      });

      if (customCommand) {
        return this.executeCustomCommand(customCommand);
      }
    }

    // Provide context-aware error messages
    const commandExists = [
      ...(this.game.CustomCommands || []).map(cmd => cmd.Verb.toLowerCase()),
      ...focalPoints.flatMap(p => p.Events
        .filter(e => typeof e.Event === 'string')
        .map(e => e.Event.replace('custom-', '').toLowerCase())
      )
    ].includes(verb);

    if (commandExists) {
      if (!target) {
        return ["What do you want to " + verb + "?"];
      } else {
        return ["You can't " + verb + " that."];
      }
    } else {
      return ["I don't understand that command."];
    }
  }

  private executeCustomCommand(command: Event | CommandAlias): string[] {
    const messages: string[] = [];

    // Check required items
    if (command.RequiredItems) {
      const missingItems = command.RequiredItems.filter(
        itemId => !this.state.inventory.includes(itemId)
      );
      if (missingItems.length > 0) {
        const missingNames = missingItems.map(id => 
          this.game.Items.find(item => item.Id === id)?.Name || id
        );
        messages.push(`You need ${missingNames.join(' and ')} to do that.`);
        return messages;
      }
    }
    
    // Check required flags
    if (command.RequiredFlags) {
      const flagsMatch = command.RequiredFlags.every(flag => 
        (this.state.flags[flag.Name] || false) === flag.Flag
      );
      if (!flagsMatch) {
        messages.push("You can't do that right now.");
        return messages;
      }
    }
    
    // Execute custom command actions
    for (const action of command.Actions) {
      messages.push(...this.executeAction(action));
    }
    return messages;
  }

  private isStandardCommand(verb: string): boolean {
    return ['look', 'examine', 'interact', 'move', 'inventory', 'use', 'take', 'help'].includes(verb);
  }

  private executeStandardCommand(verb: string, target: string, command?: string): string[] {
    const messages: string[] = [];
    const visiblePoints = this.getFocalPoints();
    const visibleItems = this.getSpawnedItems();
    const words = target ? [verb, ...target.split(/\s+/)] : [verb];

    switch (verb) {
      case 'look': {
        const location = this.getCurrentLocation();
        messages.push(location.Description);
        
        if (visiblePoints.length > 0) {
          messages.push('\nYou can see:');
          visiblePoints.forEach(point => {
            messages.push(`- ${point.Name}`);
          });
        }
        
        if (visibleItems.length > 0) {
          messages.push('\nItems in the area:');
          visibleItems.forEach(item => {
            if (item) messages.push(`- ${item.Name}`);
          });
        }
        break;
      }

      case 'examine': {
        const focalPoint = visiblePoints.find(
          point => point.Name.toLowerCase() === target.toLowerCase()
        );
        if (focalPoint) {
          messages.push(focalPoint.Description);
        } else {
          messages.push("You don't see that here.");
        }
        break;
      }

      case 'interact': {
        const targetIndex = visiblePoints.findIndex(
          point => point.Name.toLowerCase() === target.toLowerCase()
        );

        if (targetIndex !== -1) {
          const point = visiblePoints[targetIndex];
          const interactEvent = point.Events.find(event => event.Event === EVENT_TYPES.INTERACT);
          if (interactEvent) {
            const eventIndex = point.Events.indexOf(interactEvent);
            messages.push(...this.executeEvent(targetIndex, eventIndex));
          } else {
            messages.push("Nothing happens.");
          }
        } else {
          messages.push("You don't see that here.");
        }
        break;
      }
      
      case 'move': {
        const availableLocations = this.getAvailableLocations();
        
        if (!target) {
          if (availableLocations.length === 0) {
            messages.push("There's nowhere you can go from here.");
          } else {
            messages.push("You can go to:");
            availableLocations.forEach(loc => {
              messages.push(`- ${loc.name} (via ${loc.description})`);
            });
          }
        } else {
          const targetName = target.toLowerCase();
          const target = availableLocations.find(
            loc => loc.name.toLowerCase() === targetName
          );
          
          if (target) {
            messages.push(...this.moveToLocation(target.index));
          } else {
            messages.push("You can't go there from here.");
          }
        }
        break;
      }

      case 'inventory': {
        const inventory = this.getInventory();
        if (inventory.length === 0) {
          messages.push("You're not carrying anything.");
        } else {
          messages.push('You are carrying:');
          inventory.forEach(item => {
            if (item) messages.push(`- ${item.Name}`);
          });
        }
        break;
      }

      case 'help': {
        messages.push(HELP_TEXT);
        break;
      }
      
      case 'take': {
        const itemName = target.toLowerCase();
        const item = visibleItems.find(
          item => item?.Name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (item) {
          if (this.takeItem(item.Id)) {
            messages.push(`You take the ${item.Name}.`);
          } else {
            messages.push("You can't take that.");
          }
        } else {
          messages.push("You don't see that here.");
        }
        break;
      }

      case 'use': {
        const fullCommand = command || `use ${target}`;
        const useMatch = fullCommand.match(/use\s+(.+?)\s+on\s+(.+)/i);
        if (useMatch) {
          const [_, itemName, targetName] = useMatch.map(s => s.toLowerCase());
          
          // Find the item in inventory
          const item = this.getInventory().find(
            item => item?.Name.toLowerCase() === itemName.toLowerCase()
          );

          if (!item) {
            messages.push(`You don't have a ${itemName}.`);
            break;
          }

          // Try to find target as a focal point first
          const focalPointIndex = this.getFocalPoints().findIndex(
            point => point.Name.toLowerCase() === targetName.toLowerCase()
          );

          if (focalPointIndex !== -1) {
            messages.push(...this.executeItemUse(item.Id, null, focalPointIndex));
            break;
          }

          // If not a focal point, try to find as another item
          const targetItem = this.getInventory().find(
            item => item?.Name.toLowerCase() === targetName.toLowerCase()
          );

          if (targetItem) {
            messages.push(...this.executeItemUse(item.Id, targetItem.Id, null));
          } else {
            messages.push(`You don't see a ${targetName} to use that on.`);
          }
        } else {
          messages.push('Use what on what? (Format: use [item] on [object])');
        }
        break;
      }

      default:
        messages.push("I don't understand that command.");
    }

    return messages;
  }

  public executeEvent(focalPointIndex: number, eventIndex: number): string[] {
    const focalPoint = this.getFocalPoints()[focalPointIndex];
    const event = focalPoint.Events[eventIndex];
    const messages: string[] = [];

    if (!event) return messages;
    
    // Handle custom command events
    if (typeof event.Event === 'string' && event.Event.startsWith('custom-')) {
      const commandVerb = event.Event.replace('custom-', '');
      const customCommand = this.game.CustomCommands?.find(cmd => cmd.Verb === commandVerb);
      if (customCommand) {
        return this.executeCustomCommand(customCommand);
      }
      return messages;
    }
    
    // Handle standard events
    if ((event.Event === EVENT_TYPES.USE_ITEM || event.Event === EVENT_TYPES.USE_WITH_ITEM) && !event.ItemId) {
      messages.push("This event requires an item.");
      return messages;
    }

    event.Actions.forEach(action => {
      messages.push(...this.executeAction(action));
    });

    return messages;
  }

  public executeItemUse(itemId: string, targetId: string | null, focalPointIndex: number | null): string[] {
    const messages: string[] = [];
    const item = this.game.Items.find(item => item.Id === itemId);
    
    if (!item) {
      messages.push("That item doesn't exist.");
      return messages;
    }
nd
    // Case 1: Using item on a focal point
    if (focalPointIndex !== null) {
      const focalPoint = this.getFocalPoints()[focalPointIndex];
      if (!focalPoint) {
        messages.push("You can't use that here.");
        return messages;
      }

      const eventIndex = focalPoint.Events.findIndex(
        event => event.Event === EVENT_TYPES.USE_ITEM && event.ItemId === itemId
      );

      if (eventIndex === -1) {
        messages.push(`You can't use the ${item.Name} on that.`);
        return messages;
      }

      return this.executeEvent(focalPointIndex, eventIndex);
    }

    // Case 2: Using item with another item
    if (targetId) {
      const targetItem = this.game.Items.find(item => item.Id === targetId);
      if (!targetItem) {
        messages.push("That item doesn't exist.");
        return messages;
      }

      if (!this.state.inventory.includes(itemId) || !this.state.inventory.includes(targetId)) {
        messages.push("You need to have both items to use them together.");
        return messages;
      }

      const location = this.getCurrentLocation();
      for (const focalPoint of location.FoculPoints) {
        const event = focalPoint.Events.find(
          event => event.Event === EVENT_TYPES.USE_WITH_ITEM && 
                  event.ItemId === itemId
        );

        if (event) {
          const eventIndex = focalPoint.Events.indexOf(event);
          return this.executeEvent(location.FoculPoints.indexOf(focalPoint), eventIndex);
        }
      }

      messages.push(`You can't use the ${item.Name} with the ${targetItem.Name}.`);
    }

    return messages;
  }

  private executeAction(action: Action): string[] {
    const messages: string[] = [];
    
    switch (action.Event) {
      case 0: // Display message
        messages.push(action.Arguments[0]);
        break;
      case 1: // Add item
        this.state.spawnedItems[action.Arguments[0]] = true;
        const currentLocation = this.game.Maps[this.state.currentMap].Locations[this.state.currentLocation];
        if (!currentLocation.Items) {
          currentLocation.Items = [];
        }
        if (!currentLocation.Items.includes(action.Arguments[0])) {
          currentLocation.Items.push(action.Arguments[0]);
        }
        break;
      case 2: // Remove item
        this.state.inventory = this.state.inventory.filter(
          item => item !== action.Arguments[0]
        );
        break;
      case 3: // Move to location
        this.state.currentLocation = parseInt(action.Arguments[0]);
        break;
      case 4: // Set flag
        this.state.flags[action.Arguments[0]] = action.Arguments[1] === 'true';
        break;
    }

    return messages;
  }

  public getAvailableLocations(): { index: number; name: string; description: string; }[] {
    const currentLocation = this.getCurrentLocation();
    const availableLocations: { index: number; name: string; description: string; }[] = [];

    currentLocation.FoculPoints.forEach(point => {
      if (point.Flags && point.Flags.length > 0) {
        const flagsMatch = point.Flags.every(flag => 
          (this.state.flags[flag.Name] || false) === flag.Flag
        );
        if (!flagsMatch) return;
      }

      point.Events.forEach(event => {
        event.Actions.forEach(action => {
          if (action.Event === 3) {
            const locationIndex = parseInt(action.Arguments[0]);
            const targetLocation = this.game.Maps[this.state.currentMap].Locations[locationIndex];
            availableLocations.push({
              index: locationIndex,
              name: targetLocation.Name,
              description: point.Name
            });
          }
        });
      });
    });

    return availableLocations;
  }

  public moveToLocation(locationIndex: number): string[] {
    const messages: string[] = [];
    const availableLocations = this.getAvailableLocations();
    const targetLocation = availableLocations.find(loc => loc.index === locationIndex);

    if (!targetLocation) {
      messages.push("You can't go there from here.");
      return messages;
    }

    this.state.currentLocation = locationIndex;
    const newLocation = this.getCurrentLocation();
    messages.push(`\nLocation: ${newLocation.Name}\n${newLocation.Description}`);

    return messages;
  }

  public takeItem(itemId: string): boolean {
    if (this.state.spawnedItems[itemId]) {
      this.state.spawnedItems[itemId] = false;
      this.state.inventory.push(itemId);
      return true;
    }
    return false;
  }

  public getGameState(): GameState {
    return { ...this.state };
  }

  public loadGameState(state: GameState) {
    this.state = { ...state };
  }
}

const HELP_TEXT = `Available commands:
  look - Look around the current location
  examine [object] - Examine an object closely
  interact [object] - Interact with an object
  move - List available locations to move to
  move [location] - Move to a specific location
  inventory - Check your inventory
  use [item] on [object] - Use an item on an object
  take [item] - Take an item
  help - Show this help message

Custom commands are available for certain objects - try different verbs!`;