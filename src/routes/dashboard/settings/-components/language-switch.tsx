"use client";

import { Button } from "@/components/ui/button";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { changeLanguage, type Locale } from "@/lib/intl/client";

export function LanguageSwitch() {
    const { i18n } = useLingui();

    const handleLanguageChange = (locale: Locale) => {
        changeLanguage(locale);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Globe size={16} />
                    <span>{t`Language`}</span>
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                        {i18n.locale?.toUpperCase()}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange("en")} className="flex justify-between">
                    {t`English`}
                    {i18n.locale === "en" && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("de")} className="flex justify-between">
                    {t`German`}
                    {i18n.locale === "de" && <Check size={16} />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
