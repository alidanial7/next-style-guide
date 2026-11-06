/** Homepage sample — reflects scaffold choices; replace with real UI. */
export function WelcomeCard() {
  return (
    <div className="card">
      <h2>Your scaffold</h2>
      <ul>
        <li>Package manager: pnpm</li>
        <li>Styling: Plain CSS</li>
        <li>Validation: zod</li>
        <li>Auth: jwt</li>
        <li>No client store</li>
        <li>No dark mode</li>
        <li>Direction: ltr</li>
        <li>No SEO helpers</li>
        <li>RSC / fetch (no TanStack Query)</li>
        <li>No icon library</li>
        <li>OpenAPI endpoints codegen (\`pnpm endpoints:generate\`)</li>
        <li>Docker Compose local API stub</li>
        <li>No envelope unwrap</li>
        <li>No i18n</li>
        <li>No tests</li>
        <li>Minimal ESLint</li>
        <li>No Prettier</li>
        <li>No git hooks</li>
        <li>No deploy target</li>
        <li>No CI workflow</li>
      </ul>
      <p className="meta" style={{ marginTop: "1rem" }}>
        Route UI → <code>src/app/&lt;route&gt;/_components/</code> · shared →{" "}
        <code>src/components/</code>
      </p>
    </div>
  );
}
