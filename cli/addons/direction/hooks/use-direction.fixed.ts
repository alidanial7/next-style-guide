export type TextDirection = "ltr" | "rtl";

export type DirectionValue = {
  direction: TextDirection;
  isRtl: boolean;
  canToggle: false;
  setDirection: (next: TextDirection) => void;
  toggleDirection: () => void;
};

function noop(_next?: TextDirection) {
  /* fixed direction — enable `direction=both` to toggle at runtime */
}

/** Stable fixed direction for this scaffold (`__DIRECTION__`). */
const FIXED: DirectionValue = {
  direction: "__DIRECTION__",
  isRtl: __IS_RTL__,
  canToggle: false,
  setDirection: noop,
  toggleDirection: noop,
};

export function useDirection(): DirectionValue {
  return FIXED;
}
