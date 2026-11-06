"use client";

import { useDirection } from "@/hooks/use-direction";

/** Sample control — swap for your chrome; shows runtime LTR/RTL when direction=both. */
export function DirectionToggle() {
  const { direction, setDirection, toggleDirection } = useDirection();

  return (
    <div className="direction-toggle" style={{ marginTop: "1rem" }}>
      <p className="meta" style={{ marginBottom: "0.5rem" }}>
        Text direction (sample): <strong>{direction.toUpperCase()}</strong>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setDirection("ltr")}>
          LTR
        </button>
        <button type="button" onClick={() => setDirection("rtl")}>
          RTL
        </button>
        <button type="button" onClick={toggleDirection}>
          Toggle
        </button>
      </div>
    </div>
  );
}
