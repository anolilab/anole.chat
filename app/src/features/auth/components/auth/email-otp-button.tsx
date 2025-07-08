import { LockIcon, MailIcon } from "lucide-react";
import { useContext } from "react";
import { t } from "@lingui/core/macro";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { AuthView } from "../../lib/auth-view-paths";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AuthCardClassNames } from "./auth-card";

interface EmailOTPButtonProps {
    classNames?: AuthCardClassNames;
    isSubmitting?: boolean;
    view: AuthView;
}

export function EmailOTPButton({ classNames, isSubmitting, view }: EmailOTPButtonProps) {
    const { viewPaths, navigate, basePath } = useContext(AuthUIContext);

    return (
        <Button
            className={cn("w-full", classNames?.form?.button, classNames?.form?.secondaryButton)}
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={() => navigate(`${basePath}/${view === "EMAIL_OTP" ? viewPaths.SIGN_IN : viewPaths.EMAIL_OTP}${window.location.search}`)}
        >
            {view === "EMAIL_OTP" ? <LockIcon className={classNames?.form?.icon} /> : <MailIcon className={classNames?.form?.icon} />}
            {view === "EMAIL_OTP" ? t`Sign in with password` : t`Sign in with email code`}
        </Button>
    );
}
