/** Scaffold brand mark — plain img so it works with none / Tailwind / MUI. */
export function BrandLogo({
  size = 48,
  className = "brand-logo",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      className={className}
      src="/brand/logo.svg"
      alt="next-style-guide"
      width={size}
      height={size}
      decoding="async"
    />
  );
}
