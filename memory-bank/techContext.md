# Tech Context

This document outlines the technologies and dependencies used in the AI Chat App.

## Frontend Framework & Build

- **Framework**: React 19 with React Compiler optimization
- **Build Tool**: Vite with React plugin and TypeScript paths
- **Routing**: TanStack Router v1.121+ with devtools and query integration
- **State Management**: Zustand for client-side state, TanStack Store for complex state
- **Package Manager**: pnpm v10.12+ with workspace configuration

## UI & Styling

- **Styling**: Tailwind CSS v4.1+ with Vite plugin integration
- **UI Components**: Shadcn UI built on Radix UI primitives
- **Icons**: Lucide React (500+ icons)
- **Animations**: Framer Motion v12+ for smooth transitions
- **Theme System**: next-themes for dark/light mode with system preference detection
- **Toast Notifications**: Sonner for user feedback

## Backend (Serverless Architecture)

- **Platform**: Convex (real-time serverless backend)
- **Database**: Convex real-time database with reactive queries
- **Authentication**: Better Auth v1.2+ with Convex integration (`@convex-dev/better-auth`)
- **Functions**: Convex Functions (Queries, Mutations, Actions, HTTP endpoints)
- **Rate Limiting**: `@convex-dev/rate-limiter` for API protection
- **Migrations**: `@convex-dev/migrations` for schema changes
- **HTTP Framework**: Hono v4.8+ with Convex integration (`convex-helpers/server/hono`)

### Advanced HTTP Endpoints with Hono

The project uses Hono for advanced HTTP endpoint features:

- **Dynamic Routing**: Support for path parameters (e.g., `/api/user/:userId`)
- **Middleware System**: CORS, logging, and custom middleware
- **Input Validation**: Request body and query parameter validation
- **Error Handling**: Structured error responses and custom 404 pages
- **Response Helpers**: JSON formatting with pretty printing

**Current HTTP Endpoints:**
- `POST /chat/stream` - AI chat streaming endpoint
- `POST /chat/improve-prompt` - Prompt improvement endpoint  
- `POST /email/resend/webhook` - Email service webhook
- `GET /api/health` - Health check endpoint
- `GET /api/user/:userId` - Example parameterized endpoint

**Features Enabled:**
- CORS support for all origins with credential handling
- Request/response logging for debugging
- Custom 404 and 500 error responses
- Integration with existing Better Auth routes

## AI & LLM Integration

- **Core SDK**: Vercel AI SDK v4.3+ (`ai` package)
- **Providers**:
    - `@ai-sdk/anthropic` (Claude models)
    - `@ai-sdk/google` (Gemini models) - Primary provider with latest models
    - `@ai-sdk/openai` (GPT models)
    - `@openrouter/ai-sdk-provider` (Multiple providers)
- **UI Integration**: `@assistant-ui/react` v0.10+ with External Store Runtime pattern
- **Streaming**:
    - `@convex-dev/persistent-text-streaming` for reliable streaming
    - `assistant-stream` for UI streaming integration
    - Ultra-fast micro-throttling (8ms intervals ≈ 120fps)
    - RequestAnimationFrame optimization for smooth 60fps updates
- **Agent System**: `@convex-dev/agent` for conversational AI patterns with comprehensive integration

### Frontend Streaming Architecture

The frontend streaming is managed by a collection of custom React hooks designed for performance and separation of concerns.

- **`useStreamManager`**: Manages the low-level details of the streaming connection, including an adaptive throttle, `AbortController` for cancellation, and retry logic.
- **`useMessageHandlers`**: Orchestrates user actions (new, edit, reload) and uses `useStreamManager` to execute the stream. It is responsible for creating optimistic UI updates.
- **`useConvexThreadSyncer`**: Keeps the local state synchronized with the Convex database, with special guards to prevent overwriting optimistic updates.
- **`ConvexExternalRuntimeProvider`**: The top-level provider that integrates these hooks and provides the final state to the `@assistant-ui/react` components.

### Convex Agent Component Architecture

**Agent Configuration** (`convex/ai/lib/agents.ts`):

- **Primary Models**:
    - `gemini-2.5-pro` - Most powerful thinking model with advanced reasoning
    - `gemini-2.5-flash` - Best price-performance ratio (default model)
    - `gemini-2.5-flash-lite` - Most cost-effective for high-volume tasks
    - `gemini-2.0-flash` - Next-generation model with superior speed
- **Legacy Support**: GPT-4o-mini, Claude-3-5-sonnet for comparison
- **Model-Specific Configurations**: Optimized `maxSteps`, `maxRetries`, and `contextOptions` per model

**HTTP Streaming Implementation** (`convex/chat/functions.ts`):

- **Direct HTTP Streaming**: `streamHttpAction` with `toDataStreamResponse()`
- **File Upload Support**: Handles images and documents via `getFile()` function
- **Message Persistence**: Automatic message saving with metadata tracking
- **Async Processing**: Scheduled title and summary generation

**Advanced Features**:

- **Thread Branching**: Custom parent-child thread relationships with branch point tracking
- **Context Merging**: Intelligent message history merging for branched conversations
- **File Processing**: Support for PDF analysis and image understanding
- **Rate Limiting**: Integrated with `@convex-dev/rate-limiter`
- **Error Handling**: Graceful fallbacks for unsupported files and failed requests

## Advanced Features

### File Processing & Rich Content

- **PDF Processing**: `pdf-parse` for document analysis
- **Syntax Highlighting**: Shiki v3.6+ with 100+ language support and themes
- **Math Rendering**: KaTeX for LaTeX mathematical expressions
- **Diagrams**: Mermaid v11.6+ for flowcharts and visualizations
- **Charts**: Recharts for data visualization
- **QR Codes**: react-qr-code for 2FA and sharing

### Internationalization & Accessibility

- **i18n Framework**: Lingui v5.3+ with macro support and Vite plugin
- **Locale Detection**: `@lingui/detect-locale` for automatic language detection
- **Supported Languages**: English, German (extensible)
- **Accessibility**: Full keyboard navigation, screen reader support, ARIA compliance

### User Interface Enhancements

- **Virtualization**: TanStack Virtual for efficient large list rendering
- **Drag & Drop**: `@dnd-kit` (core, sortable, utilities) for thread reordering
- **Forms**: TanStack Form with validation
- **Tables**: TanStack Table for data display
- **Resizable Panels**: react-resizable-panels for layout flexibility
- **Command Palette**: cmdk for search and commands
- **Input Components**: input-otp for 2FA, react-day-picker for dates

## Authentication & Security

- **Core Auth**: Better Auth v1.2+ with comprehensive features
- **2FA Support**: TOTP implementation with QR code generation
- **Passkey Support**: WebAuthn for passwordless authentication
- **Session Management**: JWT with secure cookie handling (jose library)
- **Password Security**: Secure hashing and validation
- **Magic Links**: Email-based passwordless login

## Email & Communication

- **Email Framework**: React Email v4.0+ for template creation
- **Email Service**: Resend integration via `@convex-dev/resend`
- **Templates**: Comprehensive email templates for all auth flows
- **Email Development**: Local email server for development testing

## Development & Quality

- **TypeScript**: v5.8+ with strict configuration
- **Testing**: Vitest v3.2+ with React Testing Library and jsdom
- **Linting/Formatting**: Prettier v3.5+ with Tailwind plugin
- **Type Safety**: Zod v3.25+ for runtime validation
- **Environment**: `@t3-oss/env-core` for environment variable validation
- **Fake Data**: Faker.js for development and testing

## Performance & Monitoring

- **Analytics**: PostHog integration for user analytics and error tracking
- **Performance**: React Scan for development performance monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Client Hints**: `@epic-web/client-hints` for device detection
- **Bundle Analysis**: Vite built-in analysis tools

## Payment & Subscriptions

- **Payment Provider**: Polar SDK integration for subscription management
- **Subscription Logic**: Built-in subscription handling in Convex functions

## Extensibility & Integrations

- **Model Context Protocol**: `@modelcontextprotocol/sdk` for AI tool extensions
- **MCP Adapter**: `@vercel/mcp-adapter` for Vercel integration
- **Workflow Engine**: `@convex-dev/workflow` for complex business processes
- **External APIs**: Structured integration patterns for third-party services

## Development Environment

- **Node.js**: v24+ (latest LTS)
- **Package Manager**: pnpm with workspace support
- **Dev Server**: Vite dev server with HMR
- **Environment Sync**: Custom scripts for Convex environment variable management
- **Encryption**: Custom key generation scripts for secure authentication

## Architecture Patterns

- **Serverless-First**: All backend logic in Convex functions
- **Real-time by Default**: Reactive queries and live updates
- **Type-Safe End-to-End**: TypeScript from frontend to backend
- **Component-Driven**: Modular UI components with clear boundaries
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile-First Responsive**: Touch-optimized interface design
