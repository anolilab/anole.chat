import type HCaptcha from "@hcaptcha/react-hcaptcha";
import { t } from "@lingui/core/macro";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import type { RefObject } from "react";
import { use, useRef } from "react";

import { useAuth } from "@/features/auth/lib/auth-ui-provider";

// Default captcha endpoints
const DEFAULT_CAPTCHA_ENDPOINTS = ["/sign-up/email", "/sign-in/email", "/forget-password"];

export function useCaptcha() {
    const { captcha } = useAuth();

    const captchaReference = useRef<any>(null);

    const executeCaptcha = async () => {
        if (!captcha) throw new Error(t`Missing captcha response`);

        // Sanitize the action name for reCAPTCHA
        let response: string | undefined | null;

        switch (captcha.provider) {
            case "cloudflare-turnstile": {
                const turnstileReference = captchaReference as RefObject<TurnstileInstance>;

                response = turnstileReference.current.getResponse();
                break;
            }
            case "hcaptcha": {
                const hcaptchaReference = captchaReference as RefObject<HCaptcha>;

                response = hcaptchaReference.current.getResponse();
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
        captchaRef: captchaReference,
        getCaptchaHeaders,
    };
}
