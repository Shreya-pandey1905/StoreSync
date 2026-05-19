import React, { createContext, useContext, useEffect, useState } from 'react';

type DarkModeContextType = {
    darkMode: boolean;
    toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const finalMode = savedMode !== null ? JSON.parse(savedMode) : systemPrefersDark;
        setDarkMode(finalMode);

        if (finalMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Listen for system theme changes (only if no saved preference)
        if (savedMode === null) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                setDarkMode(e.matches);
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', JSON.stringify(newMode));

        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};