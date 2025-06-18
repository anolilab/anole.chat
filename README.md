# AI Chat

A modern, feature-rich AI chat application built with React, Convex, and the Vercel AI SDK. Chat with multiple AI models, manage conversations with advanced tools, and enjoy a seamless real-time experience.

## ✨ Features

### 🎯 Core Features

- **Multiple AI Models**: Chat with various LLMs including GPT-4, Claude, Gemini, and more via OpenAI, Anthropic, Google, and OpenRouter
- **Real-time Sync**: Conversations sync instantly across all your devices
- **User Authentication**: Secure authentication with session management
- **File Attachments**: Upload and chat about images and PDFs
- **Syntax Highlighting**: Beautiful code formatting with Shiki

### 🚀 Advanced Features

- **Thread Management**: Pin important conversations, drag & drop reordering, and virtual scrolling
- **AI-Powered Prompt Improvement**: Enhance your prompts with GPT-4o-mini
- **Keyboard Shortcuts**: Power-user features for efficient navigation
- **Chat Branching**: Explore different conversation paths
- **Resumable Streams**: Continue AI responses after page refresh
- **Search & Filter**: Find conversations quickly
- **Dark/Light Theme**: Beautiful UI with theme switching
- **Internationalization**: Multi-language support (English, German)
- **Math Rendering**: LaTeX/KaTeX support for mathematical expressions
- **Mermaid Diagrams**: Render flowcharts, sequence diagrams, and more
- **Charts & Visualizations**: Interactive charts with Recharts
- **QR Code Generation**: Generate QR codes for sharing
- **Model Context Protocol (MCP)**: Extensible tool system for AI interactions

### 🔧 Technical Features

- **Serverless Architecture**: Built on Convex for scalable real-time functionality
- **Modern React**: React 19 with latest features
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error boundaries and rate limiting
- **Email Integration**: Transactional emails via Resend
- **Analytics**: Optional PostHog integration

## 🛠️ Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS, Shadcn UI
- **Backend**: Convex (serverless functions, real-time database)
- **AI**: Vercel AI SDK with multiple provider support
- **Authentication**: Better Auth with Convex integration
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Visualization**: Mermaid diagrams, Recharts, KaTeX math rendering
- **Extensibility**: Model Context Protocol (MCP) for custom tools

## 🚀 Quick Start

### Prerequisites

- Node.js 24
- pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/anolilab/anole.chat.git
cd ai-chat
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

## 📞 Support

If you have any questions or run into issues:

1. Check the [project documentation](./memory-bank/)
2. Search existing [GitHub issues](https://github.com/anolilab/ai-chat/issues)
3. Create a new issue if needed
