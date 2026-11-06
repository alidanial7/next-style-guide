"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Sample control — swap for your chrome; switches locale via next-intl navigation. */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onSelect(next: (typeof routing.locales)[number]) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="sample-toggle">
      <p className="sample-toggle__label">
        {t("label")}: <strong>{locale}</strong>
      </p>
      <div className="sample-toggle__row">
        {routing.locales.map((item) => (
          <button
            key={item}
            type="button"
            className={item === locale ? "is-active" : undefined}
            disabled={pending}
            onClick={() => onSelect(item)}
          >
            {t(item)}
          </button>
        ))}
      </div>
    </div>
  );
}
