import type HCaptcha from "@hcaptcha/react-hcaptcha";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { type RefObject, useContext, useRef } from "react";

import { AuthUIContext } from "../lib/auth-ui-provider";
import { t } from "@lingui/core/macro";

// Default captcha endpoints
const DEFAULT_CAPTCHA_ENDPOINTS = ["/sign-up/email", "/sign-in/email", "/forget-password"];

export function useCaptcha() {
    const { captcha } = useContext(AuthUIContext);

    const captchaRef = useRef<any>(null);

    const executeCaptcha = async () => {
        if (!captcha) throw new Error(t`Missing captcha response`);

        // Sanitize the action name for reCAPTCHA
        let response: string | undefined | null;

        switch (captcha.provider) {
            case "cloudflare-turnstile": {
                const turnstileRef = captchaRef as RefObject<TurnstileInstance>;
                response = turnstileRef.current.getResponse();
                break;
            }
            case "hcaptcha": {
                const hcaptchaRef = captchaRef as RefObject<HCaptcha>;
                response = hcaptchaRef.current.getResponse();
                break;
            }
        }

        if (!response) {
            throw new Error(t`Missing captcha response`);
        }

        return response;
    };

    const getCaptchaHeaders = async (action: string) => {
        if (!captcha) return undefined;

        // Use custom endpoints if provided, otherwise use defaults
        const endpoints = captcha.endpoints || DEFAULT_CAPTCHA_ENDPOINTS;

        // Only execute captcha if the action is in the endpoints list
        if (endpoints.includes(action)) {
            return { "x-captcha-response": await executeCaptcha() };
        }

        return undefined;
    };

    return {
        captchaRef,
        getCaptchaHeaders,
    };
}
