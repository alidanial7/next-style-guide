import type { ThemeOptions } from "@mui/material/styles";

import themeBreakpoints from "./theme-breakpoints";
import themeComponents from "./theme-components";
import getPalette from "./theme-palette";
import themeTypography from "./theme-typography";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xxs: true;
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
  }
}

/** Shared theme options (LTR). Compose palette per mode in `MuiProvider`. */
const themeOptions: ThemeOptions = {
  direction: "ltr",
  palette: getPalette("light"),
  breakpoints: themeBreakpoints,
  typography: themeTypography,
  components: themeComponents,
};

export default themeOptions;
