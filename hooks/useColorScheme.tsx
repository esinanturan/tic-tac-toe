import { createContext, useContext, useState, ReactNode } from "react";
import { useColorScheme as _useColorScheme } from "react-native";

type ColorScheme = "light" | "dark";
type ThemeContextType = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = _useColorScheme() as ColorScheme;
  const [colorScheme, setColorScheme] =
    useState<ColorScheme>(systemColorScheme);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback to system if not in context
    return _useColorScheme();
  }
  return context.colorScheme;
}

export function useSetColorScheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useSetColorScheme must be used within a ThemeProvider");
  }
  return context.setColorScheme;
}
