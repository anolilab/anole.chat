import { LockIcon, MailIcon } from "lucide-react";
import { useContext } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { AuthView } from "../../lib/auth-view-paths";
import { cn } from "@/lib/utils";
import type { AuthLocalization } from "../../localization/auth-localization";
import { Button } from "@/components/ui/button";
import type { AuthCardClassNames } from "./auth-card";

interface MagicLinkButtonProps {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    localization: Partial<AuthLocalization>;
    view: AuthView;
}

export function MagicLinkButton({ classNames, isSubmitting, localization, view }: MagicLinkButtonProps) {
    const { viewPaths, navigate, basePath, credentials } = useContext(AuthUIContext);

    return (
        <Button
            className={cn("w-full", classNames?.form?.button, classNames?.form?.secondaryButton)}
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={() => navigate(`${basePath}/${view === "MAGIC_LINK" || !credentials ? viewPaths.SIGN_IN : viewPaths.MAGIC_LINK}${window.location.search}`)}
        >
            {view === "MAGIC_LINK" ? <LockIcon className={classNames?.form?.icon} /> : <MailIcon className={classNames?.form?.icon} />}
            {localization.SIGN_IN_WITH} {view === "MAGIC_LINK" ? localization.PASSWORD : localization.MAGIC_LINK}
        </Button>
    );
}
