"use client";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useDirection } from "@/hooks/use-direction";

/** Sample control — swap for your chrome; shows runtime LTR/RTL when direction=both. */
export function DirectionToggle() {
  const { direction, setDirection, toggleDirection } = useDirection();

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="subtitle2">Text direction (sample)</Typography>
      <ButtonGroup size="small" variant="outlined">
        <Button
          variant={direction === "ltr" ? "contained" : "outlined"}
          onClick={() => setDirection("ltr")}
        >
          LTR
        </Button>
        <Button
          variant={direction === "rtl" ? "contained" : "outlined"}
          onClick={() => setDirection("rtl")}
        >
          RTL
        </Button>
        <Button onClick={toggleDirection}>Toggle</Button>
      </ButtonGroup>
    </Stack>
  );
}
