# Convex Directory Structure Guide

This document explains the feature-based organization of the Convex backend and provides guidelines for both AI assistants and human developers.

## 📁 Directory Structure

```
convex/
├── _generated/              # Auto-generated Convex files (DO NOT EDIT)
├── lib/                     # Shared utilities across all features
│   ├── errors.ts           # Error handling utilities
│   ├── rateLimiter.ts      # Rate limiting utilities
│   ├── systemFields.ts     # System field definitions and utilities
│   └── types.ts            # Shared types and constants
├── ai/                     # AI/Agent related functionality
│   ├── lib/                # AI-specific utilities
│   │   └── agents.ts       # Agent configurations and utilities
│   ├── functions.ts        # AI-related queries/mutations/actions
│   └── schema.ts           # AI-related table definitions
├── auth/                   # Authentication & authorization
│   ├── lib/                # Auth-specific utilities (currently empty)
│   └── schema.ts           # Auth-related table definitions
├── chat/                   # Chat & messaging functionality
│   ├── lib/                # Chat-specific utilities
│   ├── functions.ts        # Chat queries/mutations/actions
│   └── schema.ts           # Chat-related table definitions
├── user/                   # User management
│   ├── lib/                # User-specific utilities
│   ├── functions.ts        # User queries/mutations/actions
│   └── schema.ts           # User-related table definitions
├── email/                  # Email functionality
│   ├── lib/                # Email-specific utilities
│   ├── functions.ts        # Email queries/mutations/actions
│   ├── schema.ts           # Email-related table definitions
│   └── templates/          # Email templates
├── subscription/           # Subscription & billing
│   ├── lib/                # Subscription-specific utilities
│   ├── functions.ts        # Subscription queries/mutations/actions
│   └── schema.ts           # Subscription-related table definitions
├── auth.config.ts          # BetterAuth configuration (MUST stay in root)
├── betterAuth.ts           # BetterAuth session utilities (root level)
├── schema.ts               # Main schema file (imports all feature schemas)
├── env.ts                  # Environment variables
├── http.ts                 # HTTP endpoints
├── crons.ts                # Scheduled jobs
├── convex.config.ts        # Convex configuration
├── README.md               # Project documentation
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Core Principles

### 1. Feature-Based Organization

Each feature has its own directory containing:

- **`functions.ts`** - All queries, mutations, and actions for the feature
- **`schema.ts`** - Database table definitions for the feature
- **`lib/`** - Feature-specific utilities, types, and helpers

### 2. Shared Resources

- **`convex/lib/`** - Utilities used across multiple features
- **`convex/ai/lib/`** - AI-specific utilities (like agent configurations)
- **`convex/schema.ts`** - Combines all feature schemas into one
- **Root files** - Configuration and global functionality

### 3. Import Path Conventions

```typescript
// ✅ Correct import paths
import { internal } from '../_generated/api'; // From feature functions
import { query } from '../_generated/server'; // From feature functions
import { getAgent } from '../ai/lib/agents'; // AI-specific utilities
import { getAgent } from '../lib/agents'; // Agents moved to ai/lib
import { ERRORS } from '../lib/errors'; // Shared utilities
import { internal } from './_generated/api'; // Wrong from features
// ❌ Incorrect import paths
import { query } from './_generated/server'; // Wrong from features
import { authTables } from './auth/schema'; // Feature schemas
```

## 📝 Usage Guidelines

### For AI Assistants

#### When Creating New Functions:

1. **Identify the feature** - Determine which feature the function belongs to
2. **Add to correct file** - Place in the appropriate `functions.ts` file
3. **Update imports** - Use correct relative paths
4. **Follow naming** - Use descriptive function names

#### When Adding Database Tables:

1. **Add to feature schema** - Define tables in the feature's `schema.ts`
2. **Export table object** - Export as `{featureName}Tables`
3. **Update main schema** - Import and spread in `convex/schema.ts`

#### When Creating Utilities:

- **Feature-specific** → `{feature}/lib/`
- **AI-specific** → `convex/ai/lib/`
- **Cross-feature** → `convex/lib/`

#### Important Auth Function References:

- **Session validation** → `internal.betterAuth.getSession` (root level function)
- **Auth queries** → No auth/functions.ts exists, use betterAuth.ts directly

### For Human Developers

#### Adding a New Feature:

```bash
# 1. Create feature directory structure
mkdir -p convex/newfeature/lib

# 2. Create required files
touch convex/newfeature/functions.ts
touch convex/newfeature/schema.ts

# 3. Update main schema to import new feature
# Edit convex/schema.ts to include new feature tables
```

#### Function Reference Patterns:

```typescript
// Public functions (accessible from frontend)
// AI-specific utilities
import { getAgent } from '../ai/lib/agents';

api.chat.functions.createThread;
api.auth.functions.updateProfile;

// Internal functions (backend only)
internal.chat.functions.createThreadRelationship;
internal.betterAuth.getSession; // Root level auth function
internal.email.functions.sendWelcomeEmail;
```

## 🔧 Migration Guide

### From Old Structure to New Structure:

#### API Calls (Frontend):

```typescript
// Old
api.chat.createThread;
api.user.updateProfile;

// New
api.chat.functions.createThread;
api.auth.functions.updateProfile;
```

#### Internal Calls (Backend):

```typescript
// Old
internal.betterAuth.getSession;
internal.chat.deleteThread;

// New
internal.betterAuth.getSession; // Stays the same (root level)
internal.chat.functions.deleteThread;
```

#### Import Paths:

```typescript
// Old (from feature files)
// New (from feature files)
import { query } from '../_generated/server';
import { getAgent } from '../ai/lib/agents'; // Moved to ai/lib
import { query } from './_generated/server';
import { getAgent } from './agents';
```

## 📋 File Templates

### Feature Functions Template:

```typescript
// convex/{feature}/functions.ts
import { v } from 'convex/values';

import { internal } from '../_generated/api';
import { action, mutation, query } from '../_generated/server';

export const exampleQuery = query({
    args: { id: v.string() },
    handler: async (context, arguments_) => {
        // Session validation example
        const sessionData = await context.runQuery(
            internal.betterAuth.getSession,
            {
                sessionToken: arguments_.sessionToken,
            },
        );

        if (!sessionData?.user?.id) {
            throw new Error('Unauthorized');
        }

        // Implementation
        return { success: true };
    },
    returns: v.object({ success: v.boolean() }),
});

export const exampleMutation = mutation({
    args: { data: v.string() },
    handler: async (context, arguments_) =>
        // Implementation
        null,
    returns: v.null(),
});
```

### Feature Schema Template:

```typescript
// convex/{feature}/schema.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const {feature}Tables = {
    exampleTable: defineTable({
        name: v.string(),
        value: v.number(),
        userId: v.id("user"),
    }).index("by_userId", ["userId"]),
};
```

### Feature Lib Template:

```typescript
// convex/{feature}/lib/utils.ts
export const FEATURE_CONSTANTS = {
    DEFAULT_VALUE: 'default',
} as const;

export type FeatureType = {
    id: string;
    name: string;
};

export function featureUtility(input: string): string {
    // Feature-specific utility logic
    return input.toUpperCase();
}
```

## ⚠️ Important Notes

### DO NOT:

- Edit files in `_generated/` directory
- Move `auth.config.ts` or `betterAuth.ts` from the root
- Create circular dependencies between features
- Use relative imports that go up more than one level

### DO:

- Keep feature functions in their respective `functions.ts` files
- Use the shared `lib/` directory for cross-feature utilities
- Use `ai/lib/` for AI-specific utilities like agent configurations
- Follow the established import path conventions
- Update the main schema when adding new tables
- Document complex functions and utilities
- Use `internal.betterAuth.getSession` for session validation

## 🔍 Troubleshooting

### Common Issues:

1. **Import Path Errors**
    - Check relative paths from feature directories
    - Ensure `../` prefix for accessing root-level generated files
    - Remember agents.ts is now in `ai/lib/agents.ts`

2. **API Reference Errors**
    - Update frontend calls to use `api.{feature}.functions.{functionName}`
    - Use `internal.betterAuth.getSession` for session validation (root level)
    - Update backend calls to use `internal.{feature}.functions.{functionName}`

3. **Schema Not Found**
    - Ensure feature schema is exported as `{feature}Tables`
    - Verify main schema imports and spreads the feature tables

4. **Function Not Found**
    - Check function is exported from correct `functions.ts` file
    - Verify API reference uses correct path structure
    - Note: Auth functions are in root `betterAuth.ts`, not `auth/functions.ts`

5. **Agent Configuration Issues**
    - Import agents from `../ai/lib/agents` (not `../lib/agents`)
    - AI-related utilities should be in `ai/lib/` directory

This structure promotes maintainability, clear separation of concerns, and makes it easier for both AI assistants and human developers to understand and work with the codebase.
