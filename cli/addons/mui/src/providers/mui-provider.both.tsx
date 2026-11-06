"use client";

import { useMemo, type ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { useDirection } from "@/hooks/use-direction";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import themeOptions from "@/theme/theme";

export function MuiProvider({ children }: { children: ReactNode }) {
  const { direction, isRtl } = useDirection();

  const theme = useMemo(
    () =>
      createTheme({
        ...themeOptions,
        direction,
      }),
    [direction],
  );

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
        <div dir={direction}>{children}</div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
