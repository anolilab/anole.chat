# Auth - Local Authentication Feature

A comprehensive, feature-rich authentication system built as a local feature for modern React applications with TanStack integration, providing beautiful UI components and powerful hooks for user authentication, session management, and organization features.

## ✨ Features

- 🔐 **Complete Authentication Flow** - Sign in, sign up, password reset, email verification
- 👥 **Multi-Account Support** - Link multiple providers, switch between accounts
- 🏢 **Organization Management** - Teams, roles, permissions, invitations
- 🔑 **Advanced Security** - Two-factor auth, passkeys, session management
- 🎨 **Beautiful UI Components** - Pre-built, customizable components with Tailwind CSS
- ⚡ **TanStack Integration** - Optimized for TanStack Router and React Query
- 🛡️ **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 📱 **Responsive Design** - Mobile-first, accessible components
- 🎯 **Feature-Based Architecture** - Highly organized, maintainable codebase

## 🚀 Quick Start

### Prerequisites

This auth feature is already included in your project. You'll need:

```bash
npm install @tanstack/react-router @tanstack/react-query better-auth
```

### Basic Setup

1. **Create the Auth Client**

```typescript
// app/lib/auth-client.ts
import { createClient } from "better-auth/client";

export const authClient = createClient({
    baseURL: process.env.BETTER_AUTH_URL!,
    // Additional configuration...
});
```

2. **Set up Providers** (TanStack Start)

```typescript
// app/providers.tsx
import { AuthQueryProvider } from "@/features/auth/lib/auth-query-provider"
import { AuthUIProviderTanstack } from "@/features/auth/lib/tanstack/auth-ui-provider-tanstack"
import { Link, useRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { authClient } from "./lib/auth-client"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 1000 * 60 }
    }
})

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()

    return (
        <QueryClientProvider client={queryClient}>
            <AuthQueryProvider>
                <AuthUIProviderTanstack
                    authClient={authClient}
                    navigate={(href) => router.navigate({ to: href })}
                    replace={(href) => router.navigate({ to: href, replace: true })}
                    onSessionChange={() => router.invalidate()}
                    persistClient={false}
                    Link={({ href, ...props }) => <Link to={href} {...props} />}
                >
                    {children}
                </AuthUIProviderTanstack>
            </AuthQueryProvider>
        </QueryClientProvider>
    )
}
```

**Key Props:**

- `persistClient`: Set to `false` for TanStack Router (only needed for offline auth with persist query client)
- `navigate`: Router navigation function
- `replace`: Router replace function
- `onSessionChange`: Invalidate router cache on session changes
- `Link`: Custom Link component for navigation

**TanStack Query Integration:**
The `AuthUIProviderTanstack` component is a **wrapper around `AuthUIProvider`** that adds TanStack Query integration:

- Automatically handles query invalidation on session changes
- Optimistic updates for better UX
- Query cache management during authentication flows
- Uses `/auth/callback` path for external auth providers when `persistClient={true}`
- **Architecture**: `AuthUIProviderTanstack` → `AuthUIProvider` (core)

**When to Use Which Provider:**

- **Use `AuthUIProviderTanstack`**: When using TanStack Query for state management (recommended)
- **Use `AuthUIProvider`**: Only if you're not using TanStack Query (rare cases)

3. **Configure Root Route**

```typescript
// app/routes/__root.tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import { Providers } from "../providers"

export const Route = createRootRoute({
    component: RootComponent
})

function RootComponent() {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <Providers>
                    <Outlet />
                </Providers>
                <Scripts />
            </body>
        </html>
    )
}
```

4. **Create Auth Routes**

```typescript
// app/routes/auth/$pathname.tsx
import { AuthCard } from "@/features/auth/components/auth/auth-card"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/$pathname")({
    component: RouteComponent
})

function RouteComponent() {
    const { pathname } = Route.useParams()
    return (
        <main className="container flex grow flex-col items-center justify-center gap-3 p-4">
            <AuthCard pathname={pathname} />
        </main>
    )
}
```

## 📁 Architecture & Organization

This auth feature uses a **feature-based architecture** for optimal maintainability and developer experience:

### 🗂️ Optimized Structure

```
features/auth/
├── components/           # UI Components by feature
│   ├── auth/            # Authentication forms (11 files)
│   ├── organization/    # Organization management (22 files)
│   ├── settings/        # Settings by feature area (25+ files)
│   └── ...
├── hooks/               # Feature-grouped hooks (7 files)
│   ├── account-management.ts
│   ├── session-management.ts
│   ├── organization-management.ts
│   └── ...
├── types/               # Consolidated type definitions (5 files)
│   ├── auth-core-types.ts
│   ├── ui-configuration-types.ts
│   ├── data-structure-types.ts
│   └── ...
└── lib/                 # Utilities and configurations
```

**Key Benefits:**

- ✅ **75% file reduction** through intelligent consolidation
- ✅ **Feature-based grouping** for easier navigation
- ✅ **No barrel files** for optimal tree-shaking
- ✅ **Direct imports** for better performance

## 🎯 Core Components

### Authentication Cards

```typescript
import { AuthCard } from "@/features/auth/components/auth/auth-card"

// Dynamic authentication card that handles all auth flows
<AuthCard pathname="sign-in" />
<AuthCard pathname="sign-up" />
<AuthCard pathname="forgot-password" />
```

### Settings Components

```typescript
import { SecuritySettingsCards } from "@/features/auth/components/settings/security-settings-cards"
import { OrganizationSettingsCards } from "@/features/auth/components/organization/organization-settings-cards"

// Complete settings interface
<SecuritySettingsCards />
<OrganizationSettingsCards />
```

### User Interface

```typescript
import { UserButton } from "@/features/auth/components/user-button"

// User dropdown with account management
<UserButton />
```

## 🪝 Hooks API

### Account Management

```typescript
import { useListAccounts, useUnlinkAccount } from "@/features/auth/hooks/account-management";

const { data: accounts } = useListAccounts(authClient);
const { mutate: unlinkAccount } = useUnlinkAccount(authClient);
```

### Session Management

```typescript
import { useSession, useListSessions, useRevokeSession } from "@/features/auth/hooks/session-management";

const { data: session } = useSession(authClient);
const { data: sessions } = useListSessions(authClient);
const { mutate: revokeSession } = useRevokeSession(authClient);
```

### Organization Management

```typescript
import { useActiveOrganization, useListOrganizations, useHasPermission } from "@/features/auth/hooks/organization-management";

const { data: organization } = useActiveOrganization(authClient);
const { data: hasPermission } = useHasPermission(authClient, {
    permissions: { organization: ["update"] },
});
```

## ⚙️ Configuration

### Theme Customization

```typescript
import { AuthUIProviderTanstack } from "@/features/auth/lib/tanstack/auth-ui-provider-tanstack"

<AuthUIProviderTanstack
    authClient={authClient}
    settings={{
        appearance: {
            theme: "dark", // "light" | "dark" | "system"
            accentColor: "#3b82f6"
        }
    }}
    optimistic={true}
    // ... other props
/>
```

### Feature Configuration

```typescript
<AuthUIProviderTanstack
    authClient={authClient}
    avatar={{
        enabled: true,
        maxSize: 2 * 1024 * 1024, // 2MB
        acceptedTypes: ["image/jpeg", "image/png"]
    }}
    organization={{
        enabled: true,
        customRoles: [
            { role: "moderator", label: "Moderator" }
        ]
    }}
    social={{
        providers: ["google", "github", "discord"]
    }}
/>
```

### Query Configuration

```typescript
import { AuthQueryProvider } from "@/features/auth/lib/auth-query-provider"

<AuthQueryProvider
    sessionQueryOptions={{
        staleTime: 60 * 1000, // 1 minute
        retry: 3
    }}
    tokenQueryOptions={{
        staleTime: 600 * 1000, // 10 minutes
        retry: 1
    }}
    optimistic={true}
    refetchOnMutate={true}
>
    {/* Your auth UI components */}
</AuthQueryProvider>
```

## 🎨 Styling & Customization

### CSS Classes

All components support custom CSS classes through the `classNames` prop:

```typescript
<AuthCard
    pathname="sign-in"
    classNames={{
        base: "custom-card-styles",
        header: "custom-header",
        content: "custom-content",
        button: "custom-button"
    }}
/>
```

### Tailwind Integration

Components are built with Tailwind CSS and support all utility classes:

```typescript
<UserButton
    className="fixed top-4 right-4"
    classNames={{
        avatar: "ring-2 ring-blue-500",
        dropdown: "shadow-2xl"
    }}
/>
```

## 🔧 Advanced Usage

### Custom Authentication Flow

```typescript
import { useAuthMutation } from "@/features/auth/hooks/shared/use-auth-mutation";

const signIn = useAuthMutation({
    mutationFn: authClient.signIn.email,
    onSuccess: (data) => {
        // Handle successful sign in
        router.navigate({ to: "/dashboard" });
    },
    onError: (error) => {
        // Handle error
        toast.error(error.message);
    },
});

// Use in component
const handleSignIn = () => {
    signIn.mutate({
        email: "user@example.com",
        password: "password",
    });
};
```

### Organization Permissions

```typescript
import { useHasPermission } from "@/features/auth/hooks/organization-management"

const ProtectedComponent = () => {
    const { data: hasPermission } = useHasPermission(authClient, {
        permissions: {
            organization: ["update"],
            member: ["invite"]
        }
    })

    if (!hasPermission?.success) {
        return <div>Access denied</div>
    }

    return <AdminPanel />
}
```

## 📚 API Reference

### Providers

| Provider                 | Description                          | Usage                                |
| ------------------------ | ------------------------------------ | ------------------------------------ |
| `AuthUIProviderTanstack` | TanStack Query wrapper (recommended) | Use with TanStack Query applications |
| `AuthUIProvider`         | Core authentication provider         | Direct use (without TanStack Query)  |
| `AuthQueryProvider`      | TanStack Query configuration         | Configure query options and caching  |

### Components

| Component                   | Description                   | Props                     |
| --------------------------- | ----------------------------- | ------------------------- |
| `AuthCard`                  | Main authentication interface | `pathname`, `classNames`  |
| `UserButton`                | User profile dropdown         | `className`, `classNames` |
| `OrganizationSettingsCards` | Organization management       | `classNames`              |

### Hooks

| Hook                    | Purpose                 | Parameters                  |
| ----------------------- | ----------------------- | --------------------------- |
| `useSession`            | Get current session     | `authClient`, `options`     |
| `useListAccounts`       | List linked accounts    | `authClient`, `options`     |
| `useActiveOrganization` | Get active organization | `authClient`, `options`     |
| `useHasPermission`      | Check permissions       | `authClient`, `permissions` |

### Types

All types are available with full TypeScript support:

```typescript
import type { AuthClient, SessionData, Organization } from "@/features/auth/types";
```

## 🚀 Performance

- **Tree-shakable** - Import only what you need
- **No barrel exports** - Direct imports for optimal bundling
- **React Query integration** - Efficient caching and synchronization
- **Lazy loading** - Components load only when needed
- **Minimal re-renders** - Optimized state management

## 🛠️ Development

### File Organization

The codebase follows a **feature-based architecture**:

- **Components** grouped by feature area (auth, settings, organization)
- **Hooks** consolidated by functionality (7 grouped files vs 25+ individual)
- **Types** organized by purpose (5 consolidated files vs 25+ scattered)

### Contributing

1. Follow the existing feature-based structure
2. Keep components focused and reusable
3. Use TypeScript for all new code
4. Include proper error handling

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Better Auth Documentation](https://better-auth.com)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
