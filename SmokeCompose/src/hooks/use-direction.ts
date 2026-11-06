export type TextDirection = "ltr" | "rtl";

export type DirectionValue = {
  direction: TextDirection;
  isRtl: boolean;
  canToggle: false;
  setDirection: (next: TextDirection) => void;
  toggleDirection: () => void;
};

const noop = (_next?: TextDirection) => {
  /* fixed direction — enable `direction=both` to toggle at runtime */
};

/** Stable fixed direction for this scaffold (`ltr`). */
const FIXED: DirectionValue = {
  direction: "ltr",
  isRtl: false,
  canToggle: false,
  setDirection: noop,
  toggleDirection: noop,
};

export function useDirection(): DirectionValue {
  return FIXED;
}
