# System Patterns

This document describes the key architectural patterns and design decisions in the AI Chat App.

## Backend Architecture: Convex

The application uses Convex as its serverless backend platform. This choice centralizes several key functionalities:

- **Database**: A real-time, transactional database is used to store all application data, including users, threads, messages, and other metadata.
- **Serverless Functions**: Business logic is implemented in Convex functions:
    - **Queries**: For reading data (e.g., fetching chat history).
    - **Mutations**: For writing data (e.g., sending a message, pinning a thread).
    - **Actions**: For running side effects, such as calling third-party APIs (like LLMs) or running longer tasks.
- **Authentication**: User identity and session management are handled via `@better-auth-kit/convex`, which integrates directly with Convex's authentication system.

## AI Integration: Vercel AI SDK & Convex Actions

The core AI chat functionality is built on a pattern that combines Convex Actions with the Vercel AI SDK.

1.  A user sends a message from the client.
2.  A Convex mutation is called, which saves the user's message to the database.
3.  The mutation then schedules a Convex action to handle the LLM interaction.
4.  The action uses the Vercel AI SDK (`@ai-sdk/*`) to stream a response from the chosen language model (OpenAI, Google, etc.).
5.  The response is streamed back to the client and stored in the Convex database, often using a library like `@convex-dev/persistent-text-streaming` to ensure reliability.

## Frontend Architecture: React + Vite

The frontend is a modern React single-page application (SPA).

- **Component-Based UI**: The UI is built with components, leveraging Shadcn UI and Radix UI for primitives, which are then composed into application-specific components.
- **Client-Side Routing**: TanStack Router handles navigation within the app without full page reloads.
- **Data Fetching**: The frontend communicates with the Convex backend using the `convex/react` client, which provides reactive hooks that automatically update the UI when database state changes.
- **State Management**: Global client-side state that doesn't need to be persisted is managed with Zustand.

## Key Feature Patterns

- **Thread Management**: Threading logic, including branching, is managed through database relationships in Convex. The client-side UI uses libraries like `@dnd-kit` for interactive features like drag-and-drop reordering.
- **Prompt Improvement**: This feature is implemented as a Convex HTTP Action, creating a dedicated API endpoint (`/convex-http/chat/improve-prompt`) that can be called from the client to process and enhance a prompt without creating persistent messages in the main chat.
- **Rate Limiting**: Critical endpoints (like prompt improvement) are protected using `@convex-dev/rate-limiter` on the backend to prevent abuse.
