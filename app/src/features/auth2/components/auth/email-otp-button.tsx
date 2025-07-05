import { LockIcon, MailIcon } from "lucide-react"
import { useContext } from "react"

import { AuthUIContext } from "../../lib/auth-ui-provider"
import type { AuthView } from "../../lib/auth-view-paths"
import { cn } from "@/lib/utils"
import type { AuthLocalization } from "../../localization/auth-localization"
import { Button } from "@/components/ui/button"
import type { AuthCardClassNames } from "./auth-card"

interface EmailOTPButtonProps {
    classNames?: AuthCardClassNames
    isSubmitting?: boolean
    localization: Partial<AuthLocalization>
    view: AuthView
}

export function EmailOTPButton({
    classNames,
    isSubmitting,
    localization,
    view
}: EmailOTPButtonProps) {
    const { viewPaths, navigate, basePath } = useContext(AuthUIContext)

    return (
        <Button
            className={cn(
                "w-full",
                classNames?.form?.button,
                classNames?.form?.secondaryButton
            )}
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={() =>
                navigate(
                    `${basePath}/${view === "EMAIL_OTP" ? viewPaths.SIGN_IN : viewPaths.EMAIL_OTP}${window.location.search}`
                )
            }
        >
            {view === "EMAIL_OTP" ? (
                <LockIcon className={classNames?.form?.icon} />
            ) : (
                <MailIcon className={classNames?.form?.icon} />
            )}
            {localization.SIGN_IN_WITH}{" "}
            {view === "EMAIL_OTP"
                ? localization.PASSWORD
                : localization.EMAIL_OTP}
        </Button>
    )
}
