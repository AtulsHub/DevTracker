"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";

const ThemeCtx = createContext<{
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
} | null>(null);

const THEME_EVENT = "v2-theme-change";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem("v2-theme") as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

function subscribeTheme(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === "v2-theme") cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, cb);
  };
}

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep SSR + first client paint aligned; hydrate preference via external store.
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => "system" as Theme,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDark,
    () => false,
  );
  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem("v2-theme", t);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
