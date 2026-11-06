import type { PaletteOptions } from "@mui/material/styles";

/** Light palette — tweak tokens to match brand. */
export const lightPalette: PaletteOptions = {
  mode: "light",
  primary: {
    main: "#0b5fff",
    dark: "#0847c7",
    light: "#4d8aff",
    contrastText: "#fff",
  },
  secondary: {
    main: "#5b6472",
    light: "#8b93a0",
    dark: "#3d4450",
    contrastText: "#fff",
  },
  success: {
    main: "#1b7f4a",
    dark: "#145c36",
    light: "#2f9e63",
  },
  error: {
    main: "#d32f2f",
    dark: "#b71c1c",
    light: "#ef5350",
    contrastText: "#fff",
  },
  warning: {
    main: "#ed6c02",
    dark: "#e65100",
    contrastText: "#fff",
  },
  grey: {
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    700: "#616161",
    900: "#212121",
  },
};

/** Dark palette — used when `darkMode` is enabled. */
export const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#6b9fff",
    dark: "#3d7aef",
    light: "#9bbdff",
    contrastText: "#0a0a0a",
  },
  secondary: {
    main: "#a0a8b4",
    light: "#c5cad3",
    dark: "#7a8494",
    contrastText: "#0a0a0a",
  },
  success: {
    main: "#3dd68c",
    dark: "#2f9e63",
    light: "#6ee7b0",
  },
  error: {
    main: "#f44336",
    dark: "#d32f2f",
    light: "#e57373",
    contrastText: "#fff",
  },
  warning: {
    main: "#ffb74d",
    dark: "#ed6c02",
    contrastText: "#000",
  },
  grey: {
    100: "#121212",
    200: "#1e1e1e",
    300: "#2c2c2c",
    400: "#6b6b6b",
    500: "#9e9e9e",
    700: "#cfcfcf",
    900: "#f5f5f5",
  },
};

export default function getPalette(
  mode: NonNullable<PaletteOptions["mode"]> = "light",
): PaletteOptions {
  return mode === "dark" ? darkPalette : lightPalette;
}
