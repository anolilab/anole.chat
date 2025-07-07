// Authentication Method Error Codes
// Consolidates: email-otp-error-codes, passkey-error-codes, two-factor-error-codes, phone-number-error-codes, username-error-codes

// Email OTP authentication errors
export const EMAIL_OTP_ERROR_CODES = {
    OTP_EXPIRED: "otp expired",
    INVALID_OTP: "Invalid OTP",
    INVALID_EMAIL: "Invalid email",
    USER_NOT_FOUND: "User not found",
    TOO_MANY_ATTEMPTS: "Too many attempts"
}

// Passkey authentication errors
export const PASSKEY_ERROR_CODES = {
    CHALLENGE_NOT_FOUND: "Challenge not found",
    YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY:
        "You are not allowed to register this passkey",
    FAILED_TO_VERIFY_REGISTRATION: "Failed to verify registration",
    PASSKEY_NOT_FOUND: "Passkey not found",
    AUTHENTICATION_FAILED: "Authentication failed",
    UNABLE_TO_CREATE_SESSION: "Unable to create session",
    FAILED_TO_UPDATE_PASSKEY: "Failed to update passkey"
}

// Two-factor authentication errors
export const TWO_FACTOR_ERROR_CODES = {
    OTP_NOT_ENABLED: "OTP not enabled",
    OTP_HAS_EXPIRED: "OTP has expired",
    TOTP_NOT_ENABLED: "TOTP not enabled",
    TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled",
    BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled",
    INVALID_BACKUP_CODE: "Invalid backup code",
    INVALID_CODE: "Invalid code",
    TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE:
        "Too many attempts. Please request a new code.",
    INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie"
}

// Phone number authentication errors
export const PHONE_NUMBER_ERROR_CODES = {
    INVALID_PHONE_NUMBER: "Invalid phone number",
    PHONE_NUMBER_EXIST: "Phone number already exists",
    INVALID_PHONE_NUMBER_OR_PASSWORD: "Invalid phone number or password",
    UNEXPECTED_ERROR: "Unexpected error",
    OTP_NOT_FOUND: "OTP not found",
    OTP_EXPIRED: "OTP expired",
    INVALID_OTP: "Invalid OTP",
    PHONE_NUMBER_NOT_VERIFIED: "Phone number not verified"
}

// Username authentication errors
export const USERNAME_ERROR_CODES = {
    INVALID_USERNAME_OR_PASSWORD: "invalid username or password",
    EMAIL_NOT_VERIFIED: "email not verified",
    UNEXPECTED_ERROR: "unexpected error",
    USERNAME_IS_ALREADY_TAKEN: "username is already taken. please try another.",
    USERNAME_TOO_SHORT: "username is too short",
    USERNAME_TOO_LONG: "username is too long",
    INVALID_USERNAME: "username is invalid"
} 