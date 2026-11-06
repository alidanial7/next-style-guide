import type { TypographyVariantsOptions } from "@mui/material/styles";

const themeTypography: TypographyVariantsOptions = {
  fontFamily: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ].join(","),
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontSize: 36, fontWeight: 700 },
  h2: { fontSize: 24, fontWeight: 700 },
  h3: { fontSize: 20, fontWeight: 600 },
  h4: { fontSize: 18, fontWeight: 600 },
  h5: { fontSize: 16, fontWeight: 600 },
  h6: { fontSize: 14, fontWeight: 600 },
  body1: { fontSize: 14, fontWeight: 400 },
  body2: { fontSize: 14, fontWeight: 400 },
  subtitle1: { fontSize: 12, fontWeight: 500 },
  subtitle2: { fontSize: 12, fontWeight: 400 },
  caption: { fontSize: 10, fontWeight: 400 },
  button: { textTransform: "none", fontWeight: 600 },
};

export default themeTypography;
