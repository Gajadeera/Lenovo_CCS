// src/contexts/DarkModeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        // Check for saved preference or system preference
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) return JSON.parse(saved);

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Listen for system preference changes (only if no user preference set)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (localStorage.getItem('darkMode') === null) {
                setIsDark(mediaQuery.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        // Save preference to localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDark));

        // Apply class to document for Tailwind v4
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleDarkMode = () => setIsDark(!isDark);

    return (
        <DarkModeContext.Provider value={{ isDark, setIsDark, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
}

export function useDarkMode() {
    const context = useContext(DarkModeContext);
    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
}