"use client";

import type { ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import themeOptions from "@/theme/theme";

const theme = createTheme({
  ...themeOptions,
  direction: "rtl",
});

export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider
      key="mui-rtl"
      options={{ key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div dir="rtl">{children}</div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
