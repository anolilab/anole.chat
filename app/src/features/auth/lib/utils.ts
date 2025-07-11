import { t } from "@lingui/core/macro";

export function isValidEmail(email: string) {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

    return emailRegex.test(email);
}

/**
 * Converts error codes from SNAKE_CASE to camelCase
 * Example: INVALID_TWO_FACTOR_COOKIE -> invalidTwoFactorCookie
 */
export function errorCodeToCamelCase(errorCode: string): string {
    return errorCode.toLowerCase().replaceAll(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Gets a localized error message from an error object
 */
export function getLocalizedError({ error }: { error: any }) {
    // Handle string error codes directly
    if (typeof error === "string") {
        return getErrorTranslation(error);
    }

    // Handle error objects with nested error property
    if (error?.error) {
        if (error.error.code) {
            return getErrorTranslation(error.error.code);
        }

        return error.error.message || error.error.code || error.error.statusText || t`Request failed`;
    }

    return error?.message || t`Request failed`;
}

/**
 * Maps error codes to Lingui translations
 */
function getErrorTranslation(errorCode: string): string {
    switch (errorCode) {
        case "ACCOUNT_LOCKED": {
            return t`Account locked`;
        }
        case "ACCOUNT_NOT_FOUND": {
            return t`Account not found`;
        }
        case "ALREADY_SUBSCRIBED_PLAN": {
            return t`You're already subscribed to this plan`;
        }
        case "ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY": {
            return t`Anonymous users cannot sign in again anonymously`;
        }
        case "AUTHENTICATION_FAILED": {
            return t`Authentication failed`;
        }
        case "BACKUP_CODE_ALREADY_USED": {
            return t`Backup code already used`;
        }
        case "BACKUP_CODES_NOT_ENABLED": {
            return t`Backup codes are not enabled`;
        }
        case "BANNED_USER": {
            return t`You have been banned from this application`;
        }
        // Passkey errors
        case "CHALLENGE_NOT_FOUND": {
            return t`Challenge not found`;
        }
        // Anonymous user errors
        case "COULD_NOT_CREATE_SESSION": {
            return t`Could not create session`;
        }
        case "CREDENTIAL_ACCOUNT_NOT_FOUND": {
            return t`Credential account not found`;
        }
        case "EMAIL_CAN_NOT_BE_UPDATED": {
            return t`Email cannot be updated`;
        }
        case "EMAIL_IS_ALREADY_TAKEN": {
            return t`Email is already taken`;
        }
        case "EMAIL_NOT_VERIFIED": {
            return t`Email not verified`;
        }
        case "EMAIL_VERIFICATION_REQUIRED": {
            return t`Email verification is required before you can subscribe to a plan`;
        }
        case "EXPIRES_IN_IS_TOO_LARGE": {
            return t`The expires in is larger than the predefined maximum value`;
        }
        case "EXPIRES_IN_IS_TOO_SMALL": {
            return t`The expires in is smaller than the predefined minimum value`;
        }
        case "FAILED_TO_CREATE_SESSION": {
            return t`Failed to create session`;
        }
        case "FAILED_TO_CREATE_USER": {
            return t`Failed to create user`;
        }
        case "FAILED_TO_FETCH_PLANS": {
            return t`Failed to fetch plans`;
        }
        case "FAILED_TO_GET_SESSION": {
            return t`Failed to get session`;
        }
        case "FAILED_TO_GET_USER_INFO": {
            return t`Failed to get user info`;
        }
        case "FAILED_TO_RETRIEVE_INVITATION": {
            return t`Failed to retrieve invitation`;
        }
        case "FAILED_TO_UNLINK_LAST_ACCOUNT": {
            return t`You can't unlink your last account`;
        }
        case "FAILED_TO_UPDATE_PASSKEY": {
            return t`Failed to update passkey`;
        }

        case "FAILED_TO_UPDATE_USER": {
            return t`Failed to update user`;
        }
        case "FAILED_TO_VERIFY_REGISTRATION": {
            return t`Failed to verify registration`;
        }
        case "FORBIDDEN": {
            return t`Forbidden`;
        }
        case "ID_TOKEN_NOT_SUPPORTED": {
            return t`ID token not supported`;
        }
        case "INTERNAL_SERVER_ERROR": {
            return t`Internal server error`;
        }
        case "INVALID_API_KEY": {
            return t`Invalid API key`;
        }
        case "INVALID_API_KEY_GETTER_RETURN_TYPE": {
            return t`API Key getter returned an invalid key type. Expected string.`;
        }
        case "INVALID_BACKUP_CODE": {
            return t`Invalid backup code`;
        }
        case "INVALID_CODE": {
            return t`Invalid code`;
        }
        case "INVALID_EMAIL": {
            return t`Invalid email`;
        }
        case "INVALID_EMAIL_OR_PASSWORD":

        case "INVALID_USERNAME_OR_PASSWORD": {
            return t`Invalid email or password`;
        }
        // API Key errors
        case "INVALID_METADATA_TYPE": {
            return t`Metadata must be an object or undefined`;
        }

        case "INVALID_NAME_LENGTH": {
            return t`The name length is either too large or too small`;
        }
        // OAuth errors
        case "INVALID_OAUTH_CONFIGURATION": {
            return t`Invalid OAuth configuration`;
        }
        case "INVALID_OTP": {
            return t`Invalid OTP`;
        }
        case "INVALID_PASSWORD": {
            return t`Invalid password`;
        }
        // Phone number errors
        case "INVALID_PHONE_NUMBER": {
            return t`Invalid phone number`;
        }
        case "INVALID_PHONE_NUMBER_OR_PASSWORD": {
            return t`Invalid phone number or password`;
        }
        case "INVALID_PREFIX_LENGTH": {
            return t`The prefix length is either too large or too small`;
        }
        case "INVALID_REMAINING": {
            return t`The remaining count is either too large or too small`;
        }
        // Multi-session errors
        case "INVALID_SESSION_TOKEN": {
            return t`Invalid session token`;
        }
        case "INVALID_TOKEN": {
            return t`Invalid token`;
        }
        case "INVALID_TWO_FACTOR_CODE": {
            return t`Invalid two-factor code`;
        }
        case "INVALID_TWO_FACTOR_COOKIE": {
            return t`Invalid two factor cookie`;
        }
        case "INVALID_USER_ID_FROM_API_KEY": {
            return t`The user ID from the API key is invalid`;
        }
        case "INVALID_USERNAME": {
            return t`Invalid username`;
        }
        case "INVITATION_LIMIT_REACHED": {
            return t`Invitation limit reached`;
        }
        case "INVITATION_NOT_FOUND": {
            return t`Invitation not found`;
        }
        case "INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION": {
            return t`Inviter is no longer a member of the organization`;
        }
        case "KEY_DISABLED": {
            return t`API Key is disabled`;
        }
        case "KEY_DISABLED_EXPIRATION": {
            return t`Custom key expiration values are disabled`;
        }
        case "KEY_EXPIRED": {
            return t`API Key has expired`;
        }
        case "KEY_NOT_FOUND": {
            return t`API Key not found`;
        }
        case "KEY_NOT_RECOVERABLE": {
            return t`API Key is not recoverable`;
        }
        case "MEMBER_NOT_FOUND": {
            return t`Member not found`;
        }

        case "METADATA_DISABLED": {
            return t`Metadata is disabled`;
        }
        case "MISSING_RESPONSE": {
            return t`Missing CAPTCHA response`;
        }
        case "MISSING_SECRET_KEY": {
            return t`Missing secret key`;
        }
        case "NETWORK_ERROR": {
            return t`Network error`;
        }
        case "NO_ACTIVE_ORGANIZATION": {
            return t`No active organization`;
        }
        case "NO_VALUES_TO_UPDATE": {
            return t`No values to update`;
        }
        case "NOT_FOUND": {
            return t`Not found`;
        }
        case "ORGANIZATION_ALREADY_EXISTS": {
            return t`Organization already exists`;
        }
        case "ORGANIZATION_MEMBERSHIP_LIMIT_REACHED": {
            return t`Organization membership limit reached`;
        }
        case "ORGANIZATION_NOT_FOUND": {
            return t`Organization not found`;
        }
        // Email OTP errors
        case "OTP_EXPIRED": {
            return t`OTP expired`;
        }
        case "OTP_HAS_EXPIRED": {
            return t`OTP has expired`;
        }
        // Two-factor authentication errors
        case "OTP_NOT_ENABLED": {
            return t`OTP not enabled`;
        }
        case "OTP_NOT_FOUND": {
            return t`OTP not found`;
        }
        case "PASSKEY_NOT_FOUND": {
            return t`Passkey not found`;
        }
        // Security service errors
        case "PASSWORD_COMPROMISED": {
            return t`The password you entered has been compromised. Please choose a different password.`;
        }
        case "PASSWORD_TOO_LONG": {
            return t`Password is too long`;
        }
        case "PASSWORD_TOO_SHORT": {
            return t`Password is too short`;
        }
        case "PASSWORDS_DO_NOT_MATCH": {
            return t`Passwords do not match`;
        }
        case "PHONE_NUMBER_EXIST": {
            return t`Phone number already exists`;
        }
        case "PHONE_NUMBER_NOT_VERIFIED": {
            return t`Phone number not verified`;
        }
        case "PROVIDER_NOT_FOUND": {
            return t`Provider not found`;
        }
        case "RATE_LIMIT_EXCEEDED": {
            return t`Rate limit exceeded`;
        }
        case "REFILL_AMOUNT_AND_INTERVAL_REQUIRED": {
            return t`Refill amount is required when refill interval is provided`;
        }
        case "REFILL_INTERVAL_AND_AMOUNT_REQUIRED": {
            return t`Refill interval is required when refill amount is provided`;
        }
        case "REQUEST_FAILED": {
            return t`Request failed`;
        }
        case "ROLE_NOT_FOUND": {
            return t`Role not found`;
        }
        case "SERVER_ONLY_PROPERTY": {
            return t`The property you're trying to set can only be set from the server auth instance only`;
        }
        case "SERVICE_UNAVAILABLE": {
            return t`Service unavailable`;
        }
        case "SESSION_EXPIRED": {
            return t`Session expired. Re-authenticate to perform this action.`;
        }
        case "SOCIAL_ACCOUNT_ALREADY_LINKED": {
            return t`Social account already linked`;
        }
        case "SUBSCRIPTION_NOT_ACTIVE": {
            return t`Subscription is not active`;
        }
        // Stripe subscription errors
        case "SUBSCRIPTION_NOT_FOUND": {
            return t`Subscription not found`;
        }

        case "SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION": {
            return t`Subscription is not scheduled for cancellation`;
        }
        case "SUBSCRIPTION_PLAN_NOT_FOUND": {
            return t`Subscription plan not found`;
        }
        case "TEAM_ALREADY_EXISTS": {
            return t`Team already exists`;
        }
        case "TEAM_NOT_FOUND": {
            return t`Team not found`;
        }
        case "TOKEN_EXPIRED": {
            return t`Token expired`;
        }

        case "TOO_MANY_ATTEMPTS": {
            return t`Too many attempts`;
        }

        case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE": {
            return t`Too many attempts. Please request a new code.`;
        }

        case "TOO_MANY_REQUESTS": {
            return t`Too many requests`;
        }

        case "TOTP_NOT_ENABLED": {
            return t`TOTP not enabled`;
        }
        case "TWO_FACTOR_CODE_EXPIRED": {
            return t`Two-factor code expired`;
        }
        case "TWO_FACTOR_NOT_ENABLED": {
            return t`Two factor authentication is not enabled`;
        }
        case "UNABLE_TO_CREATE_CUSTOMER": {
            return t`Unable to create customer`;
        }
        case "UNABLE_TO_CREATE_SESSION": {
            return t`Unable to create session`;
        }
        case "UNABLE_TO_REMOVE_LAST_TEAM": {
            return t`Unable to remove last team`;
        }
        case "UNAUTHORIZED": {
            return t`Unauthorized`;
        }
        case "UNAUTHORIZED_SESSION": {
            return t`Unauthorized or invalid session`;
        }

        // Legacy error codes (for backward compatibility)
        case "UNEXPECTED_ERROR": {
            return t`Unexpected error`;
        }
        case "UNKNOWN_ERROR": {
            return t`Something went wrong`;
        }
        case "USAGE_EXCEEDED": {
            return t`API Key has reached its usage limit`;
        }
        case "USER_ALREADY_EXISTS": {
            return t`User already exists`;
        }

        case "USER_ALREADY_HAS_PASSWORD": {
            return t`User already has a password. Provide that to delete the account.`;
        }
        case "USER_BANNED": {
            return t`User is banned`;
        }
        case "USER_EMAIL_NOT_FOUND": {
            return t`User email not found`;
        }
        case "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION": {
            return t`User is already a member of this organization`;
        }
        case "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION": {
            return t`User is already invited to this organization`;
        }
        case "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION": {
            return t`User is not a member of the organization`;
        }
        // Base authentication errors
        case "USER_NOT_FOUND": {
            return t`User not found`;
        }

        case "USERNAME_IS_ALREADY_TAKEN": {
            return t`Username is already taken`;
        }
        case "USERNAME_TOO_LONG": {
            return t`Username is too long`;
        }
        case "USERNAME_TOO_SHORT": {
            return t`Username is too short`;
        }
        // CAPTCHA errors
        case "VERIFICATION_FAILED": {
            return t`Captcha verification failed`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_BAN_USERS": {
            return t`You are not allowed to ban users`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION": {
            return t`You are not allowed to cancel this invitation`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE": {
            return t`You are not allowed to change users role`;
        }
        // Organization errors
        case "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION": {
            return t`You are not allowed to create a new organization`;
        }

        case "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM": {
            return t`You are not allowed to create a new team`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION": {
            return t`You are not allowed to create teams in this organization`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS": {
            return t`You are not allowed to create users`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION": {
            return t`You are not allowed to delete teams in this organization`;
        }

        case "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER": {
            return t`You are not allowed to delete this member`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION": {
            return t`You are not allowed to delete this organization`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM": {
            return t`You are not allowed to delete this team`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS": {
            return t`You are not allowed to delete users`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS": {
            return t`You are not allowed to impersonate users`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE": {
            return t`You are not allowed to invite user with this role`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION": {
            return t`You are not allowed to invite users to this organization`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS": {
            return t`You are not allowed to list users`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS": {
            return t`You are not allowed to list users sessions`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY": {
            return t`You are not allowed to register this passkey`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS": {
            return t`You are not allowed to revoke users sessions`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD": {
            return t`You are not allowed to set users password`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER": {
            return t`You are not allowed to update this member`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION": {
            return t`You are not allowed to update this organization`;
        }
        case "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM": {
            return t`You are not allowed to update this team`;
        }
        case "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION": {
            return t`You are not the recipient of the invitation`;
        }
        // Admin permission errors
        case "YOU_CANNOT_BAN_YOURSELF": {
            return t`You cannot ban yourself`;
        }
        case "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER": {
            return t`You cannot leave the organization as the only owner`;
        }
        case "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS": {
            return t`You have reached the maximum number of organizations`;
        }
        case "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS": {
            return t`You have reached the maximum number of teams`;
        }

        default: {
            return t`Request failed`;
        }
    }
}

export function getKeyByValue<T extends Record<string, unknown>>(object: T, value?: T[keyof T]): keyof T | undefined {
    return (Object.keys(object) as (keyof T)[]).find((key) => object[key] === value);
}
