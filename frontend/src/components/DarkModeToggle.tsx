// src/components/DarkModeToggle.tsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full shadow transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-blue-600" />}
    </button>
  );
};

export default DarkModeToggle;
