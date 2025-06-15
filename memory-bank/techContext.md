# Tech Context

This document outlines the technologies and dependencies used in the AI Chat App.

## Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **UI Components**: Shadcn UI, Radix UI, Lucide Icons
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **State Management**: Zustand
- **Forms**: TanStack Form
- **Tables & Virtualization**: TanStack Table, TanStack Virtual
- **Drag and Drop**: @dnd-kit
- **Syntax Highlighting**: Shiki, Highlight.js

## Backend (Serverless)

- **Platform**: Convex
- **Authentication**: @better-auth-kit/convex
- **Real-time Database**: Convex
- **Serverless Functions**: Convex Functions (Queries, Mutations, Actions)

## AI / LLM Integration

- **SDK**: Vercel AI SDK (`@ai-sdk/*`)
- **Providers**: OpenAI, Google Anthropic, OpenRouter
- **Streaming**: `@convex-dev/persistent-text-streaming`, `assistant-stream`
- **PDF Parsing**: `pdf-parse`

## Development

- **Package Manager**: pnpm
- **Testing**: Vitest, React Testing Library
- **Linting/Formatting**: Prettier, ESLint
- **Email Development**: React Email
