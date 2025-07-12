import { t } from "@lingui/core/macro";
import { LockIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/lib/auth-ui-provider";
import { cn } from "@/lib/utils";

import type { AuthView } from "../../lib/auth-view-paths";
import type { AuthCardClassNames } from "./auth-card";

interface MagicLinkButtonProperties {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    view: AuthView;
}

export const MagicLinkButton = ({ classNames, isSubmitting, view }: MagicLinkButtonProperties) => {
    const { basePath, credentials, navigate, viewPaths } = useAuth();

    return (
        <Button
            className={cn("w-full", classNames?.form?.button, classNames?.form?.secondaryButton)}
            disabled={isSubmitting}
            onClick={() => {
                navigate(`${basePath}/${view === "MAGIC_LINK" || !credentials ? viewPaths.SIGN_IN : viewPaths.MAGIC_LINK}${globalThis.location.search}`);
            }}
            type="button"
            variant="secondary"
        >
            {view === "MAGIC_LINK" ? <LockIcon className={classNames?.form?.icon} /> : <MailIcon className={classNames?.form?.icon} />}
            {view === "MAGIC_LINK" ? t`Sign in with password` : t`Sign in with magic link`}
        </Button>
    );
};
