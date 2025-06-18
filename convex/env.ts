// Global declaration for process in Convex environment
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;
        }
    }
    var process: {
        env: NodeJS.ProcessEnv;
    };
}

export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
export const SITE_URL = process.env.SITE_URL;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// System API keys (fallback when users don't provide their own)
//export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
//export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
