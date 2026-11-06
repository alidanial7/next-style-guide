"use client";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
    <Stack spacing={1} sx={{ mt: 0 }}>
      <Typography variant="subtitle2">
        {t("label")}: {locale}
      </Typography>
      <ButtonGroup size="small" variant="outlined" disabled={pending}>
        {routing.locales.map((item) => (
          <Button
            key={item}
            variant={item === locale ? "contained" : "outlined"}
            onClick={() => onSelect(item)}
          >
            {t(item)}
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
  );
}
