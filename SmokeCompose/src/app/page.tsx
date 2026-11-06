import { WelcomeCard } from "@/app/_components/welcome-card";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>SmokeCompose</h1>
        <p>
          Scaffolded with <strong>next-style-guide</strong> (Next.js 16).
          styling=<code>none</code> · validation=
          <code>zod</code> · icons=<code>none</code> ·
          data=<code>rsc</code>.
        </p>
      </section>

      <WelcomeCard />

      <p className="meta">
        Read <code>AGENTS.md</code> and <code>docs/style-guide/</code> before
        adding routes. Feature rules in <code>.cursor/rules/</code> load by glob.
      </p>
    </>
  );
}
