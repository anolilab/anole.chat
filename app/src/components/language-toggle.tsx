import { i18n } from "@lingui/core";
import { createServerFn } from "@tanstack/react-start";
import { setHeader } from "@tanstack/react-start/server";
import { serialize } from "cookie-es";
import type { FC } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_LOCALE, locales as appLocales } from "@/lib/intl/client";

const updateLanguage = createServerFn({ method: "POST" })
    .validator((locale: string) => locale)
    .handler(async ({ data }) => {
        setHeader(
            "Set-Cookie",
            serialize("locale", data, {
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
            }),
        );
    });

export const LanguageToggle: FC = () => (
    <ToggleGroup
        className="gap-1 rounded-md border-none bg-transparent p-0"
        onValueChange={(value) => {
            if (value) {
                updateLanguage({ data: value }).then(() => {
                    location.reload();
                });
            }
        }}
        type="single"
        value={i18n.locale ?? DEFAULT_LOCALE}
        variant="outline"
    >
        {Object.entries(appLocales).map(([locale, label]) => (
            <ToggleGroupItem
                aria-label={`Switch to ${label}`}
                className="h-auto rounded-sm border-none p-1 text-sm text-white hover:bg-white/10 hover:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                key={locale}
                value={locale}
            >
                {label}
            </ToggleGroupItem>
        ))}
    </ToggleGroup>
);
