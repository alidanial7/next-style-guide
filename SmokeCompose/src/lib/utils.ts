/** Lightweight class join — swap for clsx + tailwind-merge when shadcn lands. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
