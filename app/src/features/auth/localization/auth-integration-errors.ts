// Integration & External Service Error Codes
// Consolidates: captcha-error-codes, generic-oauth-error-codes, haveibeenpwned-error-codes, multi-session-error-codes, stripe-localization

// CAPTCHA verification errors
export const CAPTCHA_ERROR_CODES = {
    // External errors shown to users
    VERIFICATION_FAILED: "Captcha verification failed",
    MISSING_RESPONSE: "Missing CAPTCHA response",
    UNKNOWN_ERROR: "Something went wrong",
    // Internal errors for server logs
    MISSING_SECRET_KEY: "Missing secret key",
    SERVICE_UNAVAILABLE: "CAPTCHA service unavailable",
};

// Generic OAuth provider errors
export const GENERIC_OAUTH_ERROR_CODES = {
    INVALID_OAUTH_CONFIGURATION: "Invalid OAuth configuration",
};

// HaveIBeenPwned security service errors
export const HAVEIBEENPWNED_ERROR_CODES = {
    PASSWORD_COMPROMISED: "The password you entered has been compromised. Please choose a different password.",
};

// Multi-session authentication errors
export const MULTI_SESSION_ERROR_CODES = {
    INVALID_SESSION_TOKEN: "Invalid session token",
};

// Stripe subscription service errors
export const STRIPE_ERROR_CODES = {
    SUBSCRIPTION_NOT_FOUND: "Subscription not found",
    SUBSCRIPTION_PLAN_NOT_FOUND: "Subscription plan not found",
    ALREADY_SUBSCRIBED_PLAN: "You're already subscribed to this plan",
    UNABLE_TO_CREATE_CUSTOMER: "Unable to create customer",
    FAILED_TO_FETCH_PLANS: "Failed to fetch plans",
    EMAIL_VERIFICATION_REQUIRED: "Email verification is required before you can subscribe to a plan",
    SUBSCRIPTION_NOT_ACTIVE: "Subscription is not active",
    SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION: "Subscription is not scheduled for cancellation",
};
