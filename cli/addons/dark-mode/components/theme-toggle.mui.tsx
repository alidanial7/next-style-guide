"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@/providers/theme-provider";

/** Sample control — swap for your chrome; light / dark / system when darkMode is on. */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Stack spacing={1} sx={{ mt: 0 }}>
        <Typography variant="subtitle2">Theme</Typography>
        <ButtonGroup size="small" variant="outlined" disabled>
          <Button>…</Button>
        </ButtonGroup>
      </Stack>
    );
  }

  const active = theme ?? "system";

  return (
    <Stack spacing={1} sx={{ mt: 0 }}>
      <Typography variant="subtitle2">
        Theme (sample): {active}
        {active === "system" ? ` → ${resolvedTheme}` : ""}
      </Typography>
      <ButtonGroup size="small" variant="outlined">
        <Button
          variant={active === "light" ? "contained" : "outlined"}
          onClick={() => setTheme("light")}
        >
          Light
        </Button>
        <Button
          variant={active === "dark" ? "contained" : "outlined"}
          onClick={() => setTheme("dark")}
        >
          Dark
        </Button>
        <Button
          variant={active === "system" ? "contained" : "outlined"}
          onClick={() => setTheme("system")}
        >
          System
        </Button>
      </ButtonGroup>
    </Stack>
  );
}
