"use client";

import { useState, useEffect, useRef } from 'react';
import { GameEngine } from '@/lib/game-engine';
import { Game } from '@/lib/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import templateGame from '@/lib/template-game';
import GameLoader from '@/components/GameLoader';

export default function GameInterface() {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize game engine on client side only
    const savedGame = window.localStorage.getItem('loadedGame');
    let gameData = templateGame;
    
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        if (Array.isArray(parsed.Items) && Array.isArray(parsed.Maps)) {
          gameData = parsed;
        }
      } catch (error) {
        console.error('Error parsing saved game:', error);
      }
    }
    setGameEngine(new GameEngine(gameData));
  }, []);

  useEffect(() => {
    if (gameEngine && !gameStarted) {
      const currentMap = gameEngine.state.currentLocation;
      const gameName = window.localStorage.getItem('selectedGameFile') || 'Default Game';
      setMessages([
        `Loading "${gameName}"...`,
        gameEngine.game.Maps[0].Introduction,
        `\nLocation: ${currentMap.Name}\n${currentMap.Description}`,
        '',
        'Type "help" for available commands.',
      ]);
      setGameStarted(true);
    }
  }, [gameStarted, gameEngine]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, message]);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameEngine || !command.trim()) return;

    addMessage(`> ${command}`);
    const messages = gameEngine.handleCommand(command);
    messages.forEach(addMessage);
    setCommand('');
  };

  if (!gameEngine || !window.localStorage.getItem('selectedGameFile')) {
    return (
      <div className="terminal min-h-screen p-4">
        <div className="scanline"></div>
        <div className="terminal-content max-w-4xl mx-auto">
          <Card className="bg-transparent border-2 border-green-500 p-8">
            <div className="text-center mb-8">
              <h1 className="terminal-text text-4xl mb-4">COBIN INDUSTRIES</h1>
              <p className="terminal-text text-xl">TERMINAL INTERFACE v2.5.0</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                href="/editor" 
                className="border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500 hover:text-black transition-colors font-mono uppercase p-6 rounded flex flex-col items-center justify-center gap-3 h-40"
              >
                <Plus className="w-10 h-10" />
                <span className="text-xl text-center">Create New Terminal Program</span>
              </Link>
              
              <button
                onClick={() => {
                  window.localStorage.setItem('selectedGameFile', 'Blackwood Manor');
                  window.localStorage.setItem('loadedGame', JSON.stringify(templateGame));
                  window.location.reload();
                }}
                className="border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500 hover:text-black transition-colors font-mono uppercase p-6 rounded flex flex-col items-center justify-center gap-3 h-40"
              >
                <PlayCircle className="w-10 h-10" />
                <span className="text-xl text-center">Play Blackwood Manor</span>
              </button>
              
              <div className="h-40">
                <GameLoader />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal min-h-screen flex">
      {/* Commands Sidebar */}
      <div className="w-80 border-r-2 border-green-500">
        <Card className="bg-transparent border-2 border-green-500 h-full">
          <div className="p-4 border-b-2 border-green-500">
            <h2 className="terminal-text text-xl">Available Commands</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="terminal-text text-lg mb-2">Standard Commands</h3>
              <ul className="space-y-1">
                <li className="terminal-text text-sm">
                  <div className="font-bold">look</div>
                  <div className="text-xs opacity-80">Look around the current location to see what's here</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">examine [object]</div>
                  <div className="text-xs opacity-80">Look at something more closely to get details</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">interact [object]</div>
                  <div className="text-xs opacity-80">Interact with an object in the environment</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">move [location]</div>
                  <div className="text-xs opacity-80">Move to a new location, or just 'move' to see where you can go</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">inventory</div>
                  <div className="text-xs opacity-80">Check what items you're carrying</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">use [item] on [object]</div>
                  <div className="text-xs opacity-80">Use an item from your inventory on something in the environment</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">take [item]</div>
                  <div className="text-xs opacity-80">Pick up an item from the current location</div>
                </li>
                <li className="terminal-text text-sm">
                  <div className="font-bold">help</div>
                  <div className="text-xs opacity-80">Show this list of commands</div>
                </li>
              </ul>
            </div>
            
            {gameEngine && (
              <div>
                <h3 className="terminal-text text-lg mb-2">Custom Commands</h3>
                <ul className="space-y-1">
                  {gameEngine.state.currentLocation.FoculPoints.flatMap(point => 
                    point.Events
                      .filter(event => typeof event.Event === 'string' && event.Event.startsWith('custom-'))
                      .map(event => event.Event.replace('custom-', ''))
                  ).filter((value, index, self) => self.indexOf(value) === index)
                  .map(command => {
                    const customCommand = gameEngine.game.CustomCommands?.find(cmd => cmd.Verb === command);
                    return (
                    <li key={command} className="terminal-text text-sm">
                      <div className="font-bold">{command}</div>
                      <div className="text-xs opacity-80">
                        {customCommand?.Description || 'Custom action'}
                        {customCommand?.RequiresTarget ? ' (requires target)' : ' (no target needed)'}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Terminal */}
      <div className="scanline"></div>
      <div className="terminal-content flex-1">
        <Card className="bg-transparent border-2 border-green-500">
          <div className="terminal-header flex justify-between items-center p-4">
            <span className="terminal-text font-mono">
              COBIN INDUSTRIES UNIFIED OPERATING SYSTEM
              <br />
              COPYRIGHT 2075-2077 COBIN INDUSTRIES
              <br />
              {window.localStorage.getItem('selectedGameFile')} - {window.localStorage.getItem('SelectedGameDescription')} 
            </span>
            <Button
              onClick={() => {
                window.localStorage.removeItem('loadedGame');
                window.localStorage.removeItem('selectedGameFile');

                window.location.reload();
              }}
              className="bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors font-mono uppercase"
            >
              TERMINATE
            </Button>
          </div>
          <div 
            ref={scrollAreaRef}
            className="terminal-messages font-mono text-green-500 h-[600px] overflow-y-auto p-4 whitespace-pre-wrap"
          >
            {messages.map((message, index) => (
              <div key={index} className="mb-2">
                {message}
              </div>
            ))}
          </div>
          <form onSubmit={handleCommand} className="p-4 border-t-2 border-green-500">
            <div className="flex gap-2 items-center">
              <span className="terminal-text">{'>'}</span>
              <Input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="terminal-input flex-1 bg-transparent text-green-500 font-mono border-green-500 focus:border-green-400 focus:ring-green-400"
                placeholder="Enter command..."
                autoFocus
              />
            </div>
          </form>
        </Card>
      </div>
      
      {/* Inventory Sidebar */}
      <div className="w-80 border-l-2 border-green-500">
        <Card className="bg-transparent border-2 border-green-500 h-full">
          <div className="p-4 border-b-2 border-green-500">
            <h2 className="terminal-text text-xl">Inventory</h2>
          </div>
          <div className="p-4">
            {gameEngine && gameEngine.getInventory().length > 0 ? (
              <ul className="space-y-2">
                {gameEngine.getInventory().map((item, index) => (
                  <li key={index} className="terminal-text">
                    <div className="font-bold">{item?.Name}</div>
                    <div className="text-sm opacity-80">{item?.Description}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="terminal-text text-sm opacity-80">No items in inventory</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}