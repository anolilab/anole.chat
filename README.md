# AI Chat

A modern, feature-rich AI chat application built with React, Convex, and the Vercel AI SDK. Chat with multiple AI models, manage conversations with advanced tools, and enjoy a seamless real-time experience.

## ✨ Features

### 🎯 Core Features

- **Multiple AI Models**: Chat with various LLMs including GPT-4, Claude, Gemini, and more via OpenAI, Anthropic, Google, and OpenRouter
- **Real-time Sync**: Conversations sync instantly across all your devices
- **User Authentication**: Secure authentication with session management
    - Soon with passkeys, and 2FA support
- **File Attachments**: Upload and chat about images and PDFs with intelligent parsing
- **Syntax Highlighting**: Beautiful code formatting with Shiki and dual-theme support

### 🚀 Advanced Chat Features

- **Thread Management**: Pin important conversations, drag & drop reordering, and virtual scrolling for large lists
- **AI-Powered Prompt Improvement**: Enhance your prompts with GPT-4o-mini before sending
- **Keyboard Shortcuts**: Comprehensive power-user features for efficient navigation (Ctrl+N, Ctrl+P, arrow keys, etc.)
- **Chat Branching**: Explore different conversation paths and create alternative responses
- **Resumable Streams**: Continue AI responses after page refresh with persistent streaming
- **Search & Filter**: Dual search system - search thread titles/summaries or full message content
- **Message Feedback System**: Rate and provide feedback on AI responses (Soon)
- **Model Display**: See which AI model generated each message

### 🎨 User Interface & Experience

- **Dark/Light Theme**: Beautiful UI with smooth theme switching and system preference detection
- **Responsive Design**: Optimized for desktop and mobile with touch-friendly interactions
- **Drag & Drop**: Reorder threads with smooth animations and visual feedback
- **Virtual Scrolling**: Efficient rendering of large thread lists (>100 threads)
- **Loading States**: Comprehensive loading indicators for all operations
- **Error Handling**: Robust error boundaries with detailed error reporting and recovery options
- **Toast Notifications**: User-friendly feedback using Sonner for all operations

### 🌐 Internationalization & Accessibility

- **Multi-language Support**: Full i18n with English and German translations using Lingui
- **Keyboard Navigation**: Complete keyboard accessibility for all features
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Support**: Theme-aware components with proper color contrasts

### 🔐 Advanced Authentication

- **Email/Password Authentication**: Traditional login with secure password handling
- **Passkey Support**: WebAuthn-based passwordless authentication
- **Two-Factor Authentication (2FA)**: TOTP support with QR code setup
- **Magic Link Login**: Passwordless email-based authentication
- **Password Reset**: Secure password recovery via email
- **Session Management**: Persistent sessions with "remember me" functionality
- **Account Verification**: Email verification with OTP codes

### 📊 Visualizations & Rich Content

- **Mermaid Diagrams**: Render flowcharts, sequence diagrams, and more with live preview
- **Charts & Visualizations**: Interactive charts with Recharts integration
- **Math Rendering**: LaTeX/KaTeX support for mathematical expressions
- **QR Code Generation**: Generate QR codes for sharing and 2FA setup (Soon)
- **Markdown Support**: Full markdown rendering with GFM extensions
- **Code Blocks**: Syntax highlighting for 100+ programming languages

### 🛠️ Developer & Power User Features

- **Model Context Protocol (MCP)**: Extensible tool system for AI interactions with custom tools (Soon)
- **Rate Limiting**: Advanced rate limiting to prevent abuse and ensure fair usage
- **Analytics Integration**: Optional PostHog integration for usage analytics and error tracking (Soon)
- **Email System**: Transactional emails with React Email templates for all auth flows
- **Export Functionality**: Download conversations as text or PDF
- **Subscription Support**: Built-in subscription management with Polar integration (Soon)
- **API Endpoints**: RESTful APIs for external integrations

### 🔧 Technical Features

- **Serverless Architecture**: Built on Convex for scalable real-time functionality
- **Modern React**: React 19 with latest features and React Compiler optimization
- **Type Safety**: Full TypeScript support with strict type checking
- **Real-time Database**: Convex database with reactive queries and mutations
- **Streaming AI Responses**: Persistent text streaming with connection recovery
- **Progressive Enhancement**: Works with JavaScript disabled for core functionality
- **Performance Optimization**: Code splitting, lazy loading, and efficient re-renders

## 🛠️ Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS, Shadcn UI
- **Backend**: Convex (serverless functions, real-time database)
- **AI**: Vercel AI SDK with multiple provider support
- **Authentication**: Better Auth with Convex integration
- **Build Tool**: Vite with React Compiler
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS with CSS-in-JS support
- **UI Components**: Radix UI primitives with custom styling
- **Internationalization**: Lingui for translations and locale management
- **Visualization**: Mermaid diagrams, Recharts, KaTeX math rendering
- **Extensibility**: Model Context Protocol (MCP) for custom tools
- **Email**: React Email with Resend for transactional emails
- **Analytics**: PostHog for user analytics and error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 24
- pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/anolilab/anole.chat.git
cd anole.chat
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env-example .env
```

Edit `.env` and add your API keys:

```env
# Required for AI functionality
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
# Add OpenAI key via OpenRouter or direct OpenAI API

# Required for email features
RESEND_API_KEY=your_resend_key_here
RESEND_FROM_EMAIL="AI Chat <your-email@domain.com>"

# Optional: Analytics
VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 4. Set Up Convex

Initialize Convex (follow the prompts to create/link your project):

```bash
pnpm exec convex dev
```

> Only the first time, can be closed afterwards

### 5. Start Development Server

```bash
pnpm dev
```

### 6. Sync Environment Variables

```bash
pnpm run sync:env:local
```

The app will be available at `http://localhost:5173`

## 📝 Available Scripts

- `pnpm dev` - Start development server with Convex backend
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm email:dev` - Start email development server (port 5555)
- `pnpm sync:env` - Sync environment variables to Convex
- `pnpm sync:env:local` - Sync environment variables to local Convex
- `pnpm env:generate-encryption` - Generate encryption key for authentication
- `pnpm env:list` - List Convex environment variables
- `pnpm env:clear` - Clear Convex environment variables
- `pnpm lint:prettier:fix` - Format code with Prettier
- `pnpm translate:extract` - Extract translatable strings
- `pnpm translate:clean` - Clean translation files
- `pnpm serve` - Preview production build
- `pnpm sort-package-json` - Sort package.json dependencies

## 🔑 API Keys Setup

### Required for AI Features

1. **Anthropic**: Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. **Google AI**: Get your API key from [aistudio.google.com](https://aistudio.google.com)
3. **OpenAI** (via OpenRouter): Get your API key from [openrouter.ai](https://openrouter.ai)

### Required for Email Features

1. **Resend**: Get your API key from [resend.com](https://resend.com)

### Optional

1. **PostHog**: For analytics - get your key from [posthog.com](https://posthog.com)
2. **Polar**: For payments (if using subscription features)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev) for the serverless backend
- UI components from [Shadcn UI](https://ui.shadcn.com)
- AI integration via [Vercel AI SDK](https://sdk.vercel.ai)
- Icons from [Lucide](https://lucide.dev)
- Authentication powered by [Better Auth](https://better-auth.com)

## 📞 Support

If you have any questions or run into issues:

1. Check the [project documentation](./memory-bank/)
2. Search existing [GitHub issues](https://github.com/anolilab/ai-chat/issues)
3. Create a new issue if needed
