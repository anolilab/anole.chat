# Lingui Migration Progress: Auth Feature

This document tracks the migration of the auth feature to Lingui for all user-facing text and translations.

## Legend
- [x] = Complete
- [ ] = Not started/incomplete

## Steps
1. Hardcoded text replaced with Lingui (`<Trans>`/`t`)
2. `localization` prop removed (except for dynamic overrides)
3. English as default translation
4. Ready for message extraction

## File Checklist - COMPLETED

### Auth Core Components
- [x] components/auth/forms/sign-in-form.tsx (migrated)
- [x] components/auth/forms/sign-up-form.tsx (migrated)
- [x] components/auth/forms/two-factor-form.tsx (migrated)
- [x] components/auth/forms/recover-account-form.tsx (migrated)
- [x] components/auth/forms/reset-password-form.tsx (migrated)
- [x] components/auth/forms/magic-link-form.tsx (migrated)
- [x] components/auth/forms/forgot-password-form.tsx (migrated)
- [x] components/auth/forms/email-otp-form.tsx (migrated)
- [x] components/auth/auth-card.tsx (migrated)
- [x] components/auth/magic-link-button.tsx (migrated)
- [x] components/auth/email-otp-button.tsx (migrated)
- [x] components/auth/one-tap.tsx (migrated)
- [x] components/auth/passkey-button.tsx (migrated)
- [x] components/auth/provider-button.tsx (migrated)
- [x] components/auth/auth-form.tsx (migrated)
- [x] components/auth/otp-input-group.tsx (migrated)
- [x] components/auth/sign-out.tsx (migrated)
- [x] components/auth/auth-callback.tsx (migrated)

### Support Components
- [x] components/auth-loading.tsx (migrated)
- [x] components/captcha/captcha.tsx (migrated)
- [x] components/email/email-template.tsx (migrated)
- [x] components/form-error.tsx (migrated)
- [x] components/password-input.tsx (migrated)

### Organization Components
- [x] components/organization/accept-invitation-card.tsx (migrated)
- [x] components/organization/create-organization-dialog.tsx (migrated)
- [x] components/organization/delete-organization-card.tsx (migrated)
- [x] components/organization/invite-member-dialog.tsx (migrated)
- [x] components/organization/leave-organization-card.tsx (migrated)
- [x] components/organization/member-cell.tsx (migrated)
- [x] components/organization/member-role-cell.tsx (migrated)
- [x] components/organization/members-card.tsx (migrated)
- [x] components/organization/organization-avatar.tsx (migrated)
- [x] components/organization/organization-cell.tsx (migrated)
- [x] components/organization/organization-settings-cards.tsx (migrated)
- [x] components/organization/organizations-card.tsx (migrated)
- [x] components/organization/remove-member-dialog.tsx (migrated)
- [x] components/organization/rename-organization-card.tsx (migrated)
- [x] components/organization/resend-invitation-dialog.tsx (migrated)
- [x] components/organization/revoke-invitation-dialog.tsx (migrated)
- [x] components/organization/select-organization-card.tsx (migrated)
- [x] components/organization/switch-organization-dialog.tsx (migrated)
- [x] components/organization/update-member-role-dialog.tsx (migrated)

### Settings Components
- [x] components/settings/account-settings-cards.tsx (migrated)
- [x] components/settings/security-settings-cards.tsx (migrated)
- [x] components/settings/account/account-cell.tsx (migrated)
- [x] components/settings/account/accounts-card.tsx (migrated)
- [x] components/settings/account/delete-account-card.tsx (migrated)
- [x] components/settings/account/link-account-dialog.tsx (migrated)
- [x] components/settings/account/unlink-account-dialog.tsx (migrated)
- [x] components/settings/account/verify-account-dialog.tsx (migrated)
- [x] components/settings/api-key/api-key-cell.tsx (migrated)
- [x] components/settings/api-key/api-key-delete-dialog.tsx (migrated)
- [x] components/settings/api-key/api-key-display-dialog.tsx (migrated)
- [x] components/settings/api-key/api-keys-card.tsx (migrated)
- [x] components/settings/api-key/create-api-key-dialog.tsx (migrated)
- [x] components/settings/passkey/passkey-cell.tsx (migrated)
- [x] components/settings/passkey/passkeys-card.tsx (migrated)
- [x] components/settings/providers/provider-cell.tsx (migrated)
- [x] components/settings/providers/providers-card.tsx (migrated)
- [x] components/settings/security/change-email-card.tsx (migrated)
- [x] components/settings/security/change-password-card.tsx (migrated)
- [x] components/settings/security/session-cell.tsx (migrated)
- [x] components/settings/security/sessions-card.tsx (migrated)
- [x] components/settings/shared/session-freshness-dialog.tsx (migrated)
- [x] components/settings/shared/settings-action-button.tsx (migrated)
- [x] components/settings/shared/settings-card-footer.tsx (migrated)
- [x] components/settings/shared/settings-card-header.tsx (migrated)
- [x] components/settings/shared/settings-card.tsx (migrated)
- [x] components/settings/two-factor/backup-codes-dialog.tsx (migrated)
- [x] components/settings/two-factor/two-factor-card.tsx (migrated)
- [x] components/settings/two-factor/two-factor-password-dialog.tsx (migrated)

### Additional Auth Components
- [x] components/auth-button.tsx (migrated)
- [x] components/auth-error.tsx (migrated)
- [x] components/auth-loading-spinner.tsx (migrated)
- [x] components/auth-success.tsx (migrated)
- [x] components/captcha-button.tsx (migrated)
- [x] components/email-verification.tsx (migrated)
- [x] components/forgot-password-button.tsx (migrated)
- [x] components/magic-link-success.tsx (migrated)

## Migration Summary

**Total Files Migrated: 65+**

### Key Changes Made:
1. ✅ Replaced all `Trans` components with `t` macro using English values
2. ✅ Removed all `localization` prop usage and related logic
3. ✅ Updated all imports to use `@lingui/core/macro`
4. ✅ Ensured all user-facing text uses English values directly in `t` macro
5. ✅ Fixed all TypeScript and linter errors related to Lingui migration
6. ✅ Removed all hardcoded translation keys in favor of English text
7. ✅ Eliminated all `Trans` component dependencies
8. ✅ Standardized on `t` macro for all translations

### Migration Status: **COMPLETE** ✅

All authentication-related components have been successfully migrated to use Lingui's `t` macro with English as the default language, following the established pattern of using English values directly rather than translation keys.

---

# Previous Progress Table

| File | Lingui Text | localization Removed | English Default | Ready for Extraction |
|------|:-----------:|:-------------------:|:---------------:|:-------------------:|
| auth-card.tsx | [x] | [x] | [x] | [x] |
| magic-link-button.tsx | [x] | [x] | [x] | [x] |
| email-otp-button.tsx | [x] | [x] | [x] | [x] |
| one-tap.tsx | [x] | [x] | [x] | [x] |
| passkey-button.tsx | [x] | [x] | [x] | [x] |
| provider-button.tsx | [x] | [x] | [x] | [x] |
| auth-form.tsx | [x] | [x] | [x] | [x] |
| forms/sign-in-form.tsx | [x] | [x] | [x] | [x] |
| forms/sign-up-form.tsx | [x] | [x] | [x] | [ ] |
| forms/forgot-password-form.tsx | [x] | [x] | [x] | [ ] |
| forms/magic-link-form.tsx | [x] | [x] | [x] | [ ] |
| forms/email-otp-form.tsx | [x] | [x] | [x] | [x] |
| forms/two-factor-form.tsx | [x] | [x] | [x] | [ ] |
| forms/reset-password-form.tsx | [x] | [x] | [x] | [ ] |

---

**Notes:**
- Some files may still have `localization={{}}` as a placeholder for dynamic overrides or until all usages are removed.
- Update this file after each migration step for each file. 