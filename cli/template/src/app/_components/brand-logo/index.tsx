import Image from "next/image";

/** Scaffold brand mark — works with none / Tailwind / MUI. */
export function BrandLogo({
  size = 48,
  className = "brand-logo",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      priority
      alt="next-style-guide"
      className={className}
      height={size}
      src="/brand/logo.svg"
      width={size}
    />
  );
}
