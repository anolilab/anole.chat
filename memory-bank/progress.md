# Progress

This document tracks the implementation status of features for the AI Chat App.

## Core Requirements

- [x] **Chat with Various LLMs**: Implemented with `@ai-sdk` for Anthropic, Google, OpenAI, and OpenRouter.
- [x] **Authentication & Sync**: Implemented using Convex and `@better-auth-kit/convex`.
- [x] **Browser Friendly**: Implemented as a React/Vite web application.
- [ ] **Easy to Try**: Partially implemented for developers, but no simple user-facing deployment found.

## Bonus Features

- [x] **Attachment Support**: Implemented, with `file-upload.tsx` component and `pdf-parse` library.
- [ ] **Image Generation Support**: Not implemented.
- [x] **Syntax Highlighting**: Implemented with `shiki` and `highlight.js`.
- [x] **Resumable Streams**: Likely implemented via `@convex-dev/persistent-text-streaming`.
- [x] **Chat Branching**: Implemented, as noted in `TODO.md`.
- [ ] **Chat Sharing**: Not implemented.
- [ ] **Web Search**: Not implemented.
- [ ] **Bring Your Own Key**: Not implemented, but a UI for it is on the roadmap.
- [ ] **Mobile App**: Not implemented.

## Other Implemented Features

- [x] **Advanced Thread Management**: Pinning, drag & drop, virtual scrolling, keyboard shortcuts, and search.
- [x] **AI-Powered Prompt Improvement**: GPT-4o-mini based prompt enhancement.
- [x] **Advanced Error Handling & Rate Limiting**: Custom errors, rate limiting, and toast notifications are largely complete.
- [ ] **Message Feedback System**: In progress.
