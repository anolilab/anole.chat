import { LockIcon, MailIcon } from "lucide-react";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { AuthView } from "../../lib/auth-view-paths";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AuthCardClassNames } from "./auth-card";

interface MagicLinkButtonProps {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    view: AuthView;
}

export function MagicLinkButton({ classNames, isSubmitting, view }: MagicLinkButtonProps) {
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
            {view === "MAGIC_LINK" ? t`Sign in with password` : t`Sign in with magic link`}
        </Button>
    );
}
