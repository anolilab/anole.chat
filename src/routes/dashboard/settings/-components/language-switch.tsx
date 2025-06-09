"use client";

import { Button } from "@/components/ui/button";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSwitch() {
    const { t, i18n } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Globe size={16} />
                    <span>{t("LANGUAGE")}</span>
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                        {i18n?.language?.toUpperCase()}
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")} className="flex justify-between">
                    {t("ENGLISH")}
                    {i18n.language === "en" && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("de")} className="flex justify-between">
                    {t("GERMAN")}
                    {i18n.language === "de" && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("pt")} className="flex justify-between">
                    {t("PORTUGUESE")}
                    {i18n.language === "pt" && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("es")} className="flex justify-between">
                    {t("SPANISH")}
                    {i18n.language === "es" && <Check size={16} />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
