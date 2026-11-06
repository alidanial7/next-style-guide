"use client";

import { useDirection } from "@/hooks/use-direction";

/** Sample control — swap for your chrome; shows runtime LTR/RTL when direction=both. */
export function DirectionToggle() {
  const { direction, setDirection, toggleDirection } = useDirection();

  return (
    <div className="sample-toggle">
      <p className="sample-toggle__label">
        Direction (sample): <strong>{direction.toUpperCase()}</strong>
      </p>
      <div className="sample-toggle__row">
        <button
          type="button"
          className={direction === "ltr" ? "is-active" : undefined}
          onClick={() => setDirection("ltr")}
        >
          LTR
        </button>
        <button
          type="button"
          className={direction === "rtl" ? "is-active" : undefined}
          onClick={() => setDirection("rtl")}
        >
          RTL
        </button>
        <button type="button" onClick={toggleDirection}>
          Toggle
        </button>
      </div>
    </div>
  );
}
