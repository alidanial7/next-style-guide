/**
 * Insert a client provider around `<main>{children}</main>` in root layout.
 * Idempotent: no-op if `providerName` already appears.
 */
export function wrapLayoutMain(
  layout: string,
  options: {
    importStatement: string;
    providerName: string;
  },
): string {
  const { importStatement, providerName } = options;
  if (layout.includes(providerName)) return layout;

  let next = layout;
  if (!next.includes(importStatement.trim())) {
    next = next.replace(
      'import "./globals.css";\n',
      `import "./globals.css";\n\n${importStatement}\n`,
    );
  }

  next = next.replace(
    "<main>{children}</main>",
    `<${providerName}>\n          <main>{children}</main>\n        </${providerName}>`,
  );

  return next;
}
