import { WelcomeCard } from "@/app/_components/welcome-card";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>__PROJECT_NAME__</h1>
        <p>
          Next.js App Router scaffold from{" "}
          <strong>next-style-guide</strong>. Route UI lives under{" "}
          <code>src/app/_components/</code> (or a route&apos;s{" "}
          <code>_components/</code>); shared primitives under{" "}
          <code>src/components/</code>; HTTP helpers under <code>src/lib/</code>.
        </p>
      </section>

      <WelcomeCard />

      <p className="meta">
        Read <code>AGENTS.md</code> and <code>docs/style-guide/</code> before
        adding routes.
      </p>
    </>
  );
}
