import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Turnstile } from "@marsidev/react-turnstile";
import { type RefObject, useContext } from "react";

import { useTheme } from "next-themes";
import { AuthUIContext } from "../../lib/auth-ui-provider";

// Default captcha endpoints
const DEFAULT_CAPTCHA_ENDPOINTS = ["/sign-up/email", "/sign-in/email", "/forget-password"];

interface CaptchaProps {
    ref: RefObject<any>;
    action?: string; // Optional action to check if it's in the endpoints list
}

export function Captcha({ ref, action }: CaptchaProps) {
    const { captcha } = useContext(AuthUIContext);
    if (!captcha) return null;

    // If action is provided, check if it's in the list of captcha-enabled endpoints
    if (action) {
        const endpoints = captcha.endpoints || DEFAULT_CAPTCHA_ENDPOINTS;
        if (!endpoints.includes(action)) {
            return null;
        }
    }

    const { resolvedTheme } = useTheme();
    const theme = resolvedTheme === "dark" ? "dark" : "light";

    const showTurnstile = captcha.provider === "cloudflare-turnstile";

    const showHCaptcha = captcha.provider === "hcaptcha";

    return (
        <>
            {showTurnstile && (
                <Turnstile
                    className="mx-auto"
                    ref={ref}
                    siteKey={captcha.siteKey}
                    options={{
                        theme: theme,
                        size: "flexible",
                    }}
                />
            )}
            {showHCaptcha && (
                <div className="mx-auto">
                    <HCaptcha ref={ref} sitekey={captcha.siteKey} theme={theme} />
                </div>
            )}
        </>
    );
}
