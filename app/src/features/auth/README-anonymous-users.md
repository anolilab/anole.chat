# Anonymous User Handling

This document explains how to use the anonymous user features implemented with better-auth in your Convex application.

## Overview

Anonymous users allow visitors to use your application without creating a permanent account. They can:
- Access basic features immediately
- Convert their anonymous account to a permanent one later
- Have their data preserved during the conversion process

## Components

### 1. AnonymousButton

A button component that allows users to sign in anonymously.

```tsx
import { AnonymousButton } from "@/features/auth/components/auth/anonymous-button";

<AnonymousButton
    redirectTo="/dashboard"
    onSuccess={() => console.log("Anonymous sign-in successful")}
/>
```

### 2. AnonymousUserBanner

A banner that appears for anonymous users, encouraging them to convert their account.

```tsx
import { AnonymousUserBanner } from "@/features/auth/components/anonymous-user-banner";

<AnonymousUserBanner
    dismissible={true}
    onConvertClick={() => navigate("/auth/convert-account")}
/>
```

### 3. AnonymousUserIndicator

A badge that shows when the current user is anonymous.

```tsx
import { AnonymousUserIndicator } from "@/features/auth/components/anonymous-user-indicator";

<AnonymousUserIndicator
    showIcon={true}
    variant="secondary"
/>
```

### 4. ConvertAnonymousAccount

A form component for converting anonymous accounts to permanent ones.

```tsx
import { ConvertAnonymousAccount } from "@/features/auth/components/auth/convert-anonymous-account";

<ConvertAnonymousAccount
    onSuccess={() => navigate("/dashboard")}
    passwordValidation={{
        minLength: 8,
        maxLength: 128,
    }}
/>
```

## Hooks

### 1. useAnonymousAuth

Hook for anonymous authentication.

```tsx
import { useAnonymousAuth } from "@/features/auth/hooks/use-anonymous-auth";

const { signInAnonymously, isLoading } = useAnonymousAuth({
    onSuccess: () => {
        console.log("Anonymous sign-in successful");
    },
    onError: (error) => {
        console.error("Anonymous sign-in failed:", error);
    },
});
```

### 2. useIsAnonymous

Hook to check if the current user is anonymous.

```tsx
import { useIsAnonymous } from "@/features/auth/hooks/use-is-anonymous";

const { isAnonymous, user } = useIsAnonymous();

if (isAnonymous) {
    // Show anonymous-specific UI
}
```

## Utilities

### Anonymous User Utils

Utility functions for working with anonymous users.

```tsx
import { 
    isAnonymousUser, 
    getAnonymousUserData,
    isAnonymousAuthEnabled 
} from "@/features/auth/lib/anonymous-user-utils";

// Check if a user is anonymous
const isAnonymous = isAnonymousUser(user);

// Get anonymous user data
const anonymousData = getAnonymousUserData(user);

// Check if anonymous auth is enabled
const enabled = isAnonymousAuthEnabled();
```

## Routes

### Convert Account Route

The route for converting anonymous accounts is available at `/auth/convert-account`.

```tsx
// Navigate to convert account page
navigate({ to: "/auth/convert-account" });
```

## Integration Examples

### 1. Add Anonymous Sign-in to Auth Card

The anonymous button is automatically included in the auth card for sign-in and sign-up views.

### 2. Show Anonymous Banner in Layout

Add the anonymous user banner to your main layout:

```tsx
import { AnonymousUserBanner } from "@/features/auth/components/anonymous-user-banner";

function Layout({ children }) {
    return (
        <div>
            <AnonymousUserBanner />
            {children}
        </div>
    );
}
```

### 3. Conditional Features Based on User Type

```tsx
import { useIsAnonymous } from "@/features/auth/hooks/use-is-anonymous";

function FeatureComponent() {
    const { isAnonymous } = useIsAnonymous();

    if (isAnonymous) {
        return (
            <div>
                <p>You're using a guest account. Some features may be limited.</p>
                <AnonymousUserBanner />
            </div>
        );
    }

    return <FullFeatureSet />;
}
```

### 4. Anonymous User Demo

Use the demo component to test all anonymous user features:

```tsx
import { AnonymousUserDemo } from "@/features/auth/components/anonymous-user-demo";

<AnonymousUserDemo />
```

## Configuration

### Server-side Configuration

The anonymous plugin is already configured in `convex/convex/auth.ts`:

```ts
plugins: [
    anonymous(),
    // ... other plugins
],
```

### Client-side Configuration

The anonymous client is configured in `app/src/lib/auth/client.ts`:

```ts
plugins: [
    anonymousClient(),
    // ... other plugins
],
```

## Best Practices

1. **Clear Communication**: Always inform users when they're using an anonymous account
2. **Easy Conversion**: Make it simple for users to convert their account
3. **Data Preservation**: Ensure user data is preserved during account conversion
4. **Feature Limitations**: Clearly communicate any limitations for anonymous users
5. **Session Management**: Consider shorter session times for anonymous users

## Security Considerations

1. **Rate Limiting**: Anonymous users should have stricter rate limits
2. **Session Expiry**: Anonymous sessions should expire more quickly
3. **Data Cleanup**: Implement cleanup for abandoned anonymous accounts
4. **IP Tracking**: Consider tracking IP addresses to prevent abuse

## Troubleshooting

### Common Issues

1. **Anonymous sign-in not working**: Check that the anonymous plugin is properly configured
2. **Conversion failing**: Ensure the user is actually anonymous before attempting conversion
3. **Banner not showing**: Verify that the user has the `isAnonymous` property set to `true`

### Debug Mode

Enable debug mode to see detailed information about anonymous user operations:

```tsx
// In your auth configuration
verbose: true,
```

## API Reference

For detailed API documentation, see the individual component and hook files in the `features/auth` directory.