/** Homepage sample — replace when you add real route UI. */
export function WelcomeCard() {
  return (
    <div className="card">
      <h2>App layout</h2>
      <ul>
        <li>
          Route-only UI →{" "}
          <code>src/app/&lt;route&gt;/_components/&lt;name&gt;/index.tsx</code>
        </li>
        <li>
          Layout / homepage UI → <code>src/app/_components/</code>
        </li>
        <li>
          Shared across 2+ routes → <code>src/components/</code>
        </li>
        <li>
          HTTP / env → <code>src/lib/</code> · API helpers →{" "}
          <code>src/utils/</code>
        </li>
      </ul>
    </div>
  );
}
