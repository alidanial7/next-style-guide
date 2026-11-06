"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { useTheme } from "@/providers/theme-provider";
import { useDirection } from "@/hooks/use-direction";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import themeOptions from "@/theme/theme";
import getPalette from "@/theme/theme-palette";

export function MuiProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { direction, isRtl } = useDirection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode =
      mounted && resolvedTheme === "dark" ? ("dark" as const) : ("light" as const);
    return createTheme({
      ...themeOptions,
      direction,
      palette: getPalette(mode),
    });
  }, [mounted, resolvedTheme, direction]);

  // key swap remounts MUI subtree on LTR↔RTL (needed for stylis plugin change).
  return (
    <AppRouterCacheProvider
      key={isRtl ? "mui-rtl" : "mui-ltr"}
      options={
        isRtl
          ? { key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }
          : { key: "mui-ltr" }
      }
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={theme.palette.mode} dir={direction}>
          {children}
        </div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
