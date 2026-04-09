import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "classic" | "modern" | "minimal" | "retro" | "futuristic";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  mode: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setMode: (mode: 'light' | 'dark') => void;
};

const initialState: ThemeProviderState = {
  theme: "classic",
  mode: "light",
  setTheme: () => null,
  setMode: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "modern",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [mode, setModeState] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('vite-ui-mode') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all old themes and base classes
    root.classList.remove("light", "dark", "theme-modern", "theme-minimal", "theme-retro", "theme-futuristic");

    // Add theme class if needed (for specific overrides)
    if (theme !== 'classic') {
        root.classList.add(`theme-${theme}`);
    }

    // Determine mode
    let effectiveMode = mode;
    
    // Force modes for certain themes (unless we want to unlock them later)
    if (theme === 'classic' || theme === 'minimal' || theme === 'retro') {
        effectiveMode = 'light';
    } else if (theme === 'futuristic') {
        effectiveMode = 'dark';
    }
    // modern uses the 'mode' state directly

    root.classList.add(effectiveMode);
  }, [theme, mode]);

  const value = {
    theme,
    mode,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setMode: (mode: 'light' | 'dark') => {
        localStorage.setItem('vite-ui-mode', mode);
        setModeState(mode);
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}
