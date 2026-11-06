"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { useTheme } from "@/providers/theme-provider";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import themeOptions from "@/theme/theme";
import getPalette from "@/theme/theme-palette";

export function MuiProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode =
      mounted && resolvedTheme === "dark" ? ("dark" as const) : ("light" as const);
    return createTheme({
      ...themeOptions,
      direction: "rtl",
      palette: getPalette(mode),
    });
  }, [mounted, resolvedTheme]);

  return (
    <AppRouterCacheProvider
      key="mui-rtl"
      options={{ key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={theme.palette.mode} dir="rtl">
          {children}
        </div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
