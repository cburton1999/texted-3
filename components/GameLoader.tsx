"use client";

import { Upload } from 'lucide-react';

export default function GameLoader() {
  return (
    <div className="relative h-full w-full">
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            localStorage.setItem('selectedGameFile', file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result;
              if (typeof content === 'string') {
                localStorage.setItem('loadedGame', content);
                window.location.reload();
              }
            };
            reader.readAsText(file);
          }
        }}
        accept=".json"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Load game file"
      />
      <button className="border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500 hover:text-black transition-colors font-mono uppercase px-6 py-3 rounded flex items-center justify-center gap-2 h-full w-full">
        <Upload className="w-10 h-10 mb-3" />
        Load Terminal Data
      </button>
    </div>
  );
}