// Supported image file extensions
export const SUPPORTED_IMAGE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
    ".ico"
] as const

// Supported code file extensions
export const SUPPORTED_CODE_EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".swift",
    ".kt",
    ".dart",
    ".vue",
    ".svelte",
    ".css",
    ".scss",
    ".html",
    ".xml",
    ".json",
    ".yaml",
    ".yml"
] as const

// Supported plain text file extensions
export const SUPPORTED_PLAIN_TEXT_EXTENSIONS = [".md", ".mdx", ".txt"] as const

// Combined text extensions (code + plain text)
export const SUPPORTED_TEXT_EXTENSIONS = [
    ...SUPPORTED_PLAIN_TEXT_EXTENSIONS,
    ...SUPPORTED_CODE_EXTENSIONS
] as const

// Supported MIME types for images
export const SUPPORTED_IMAGE_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "image/webp",
    "image/bmp",
    "image/x-icon"
] as const

// Supported MIME types for text files
export const SUPPORTED_TEXT_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/html",
    "text/css",
    "text/javascript",
    "text/xml",
    "text/yaml",
    "application/json",
    "application/javascript",
    "application/typescript"
] as const

// All supported extensions combined
export const ALL_SUPPORTED_EXTENSIONS = [
    ...SUPPORTED_IMAGE_EXTENSIONS,
    ...SUPPORTED_TEXT_EXTENSIONS,
    ".pdf"
] as const

// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_TOKENS_PER_FILE = 32000 // 32k tokens

// PDF-specific limits
export const MAX_PDF_PAGES = 100
export const MAX_PDF_TOKENS = 32000 // 32k tokens

// File type validation functions
export const isImageExtension = (filename: string) => {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
    return ext ? (SUPPORTED_IMAGE_EXTENSIONS as readonly string[]).includes(ext) : false
}

export const isTextExtension = (filename: string) => {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
    return ext ? (SUPPORTED_TEXT_EXTENSIONS as readonly string[]).includes(ext) : false
}

export const isImageMimeType = (mimeType: string) => {
    return (
        mimeType.startsWith("image/") ||
        (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
    )
}

export const isTextMimeType = (mimeType: string) => {
    return (
        mimeType.startsWith("text/") ||
        (SUPPORTED_TEXT_MIME_TYPES as readonly string[]).includes(mimeType)
    )
}

export const isSupportedFile = (filename: string, mimeType?: string) => {
    // For text files, prioritize extension over MIME type since browsers often return
    // application/octet-stream for code files like .c, .rs, etc.
    const isText = isTextExtension(filename)
    const isImage = isImageExtension(filename) || (mimeType ? isImageMimeType(mimeType) : false)
    const isPdf =
        filename.toLowerCase().endsWith(".pdf") ||
        mimeType === "application/pdf" ||
        mimeType === "application/x-pdf"
    return isImage || isText || isPdf
}

// Get file accept attribute for input element
export const getFileAcceptAttribute = (includeImages = true) => {
    const textExtensions = SUPPORTED_TEXT_EXTENSIONS.join(",")
    if (includeImages) {
        return `image/*,${textExtensions}`
    }
    return textExtensions
}

// Simple token estimation (rough approximation: 1 token ≈ 4 characters)
export const estimateTokenCount = (text: string) => {
    return Math.ceil(text.length / 4)
}

// File type detection result
export interface FileTypeInfo {
    isImage: boolean
    isCode: boolean
    isText: boolean
    extension?: string
    isPdf?: boolean
}

export const getFileTypeInfo = (filename: string, mimeType?: string) => {
    const fileName = filename.toLowerCase()
    const extension = fileName.match(/\.[^.]+$/)?.[0]

    // Check by extension first (more reliable than MIME type)
    const isImage = isImageExtension(fileName)
    const isCode = extension
        ? (SUPPORTED_CODE_EXTENSIONS as readonly string[]).includes(extension)
        : false
    const isPlainText = extension
        ? (SUPPORTED_PLAIN_TEXT_EXTENSIONS as readonly string[]).includes(extension)
        : false

    // For text files, extension is more reliable than MIME type
    // (browsers often return application/octet-stream for code files)
    const isText = isCode || isPlainText || isTextExtension(fileName)

    // If not detected by extension, fall back to MIME type for images
    const finalIsImage = isImage || (mimeType ? isImageMimeType(mimeType) : false)
    const isPdf =
        extension === ".pdf" || mimeType === "application/pdf" || mimeType === "application/x-pdf"

    return { isImage: finalIsImage, isCode, isText, extension, isPdf } satisfies FileTypeInfo
}

// Get correct MIME type for a file based on its extension
export const getCorrectMimeType = (filename: string, browserMimeType?: string): string => {
    const fileInfo = getFileTypeInfo(filename, browserMimeType)

    // If it's an image and browser provided a valid image MIME type, use it
    if (fileInfo.isImage && browserMimeType && isImageMimeType(browserMimeType)) {
        return browserMimeType
    }

    // If it's a text file (any kind), just use text/plain
    if (fileInfo.isText) {
        return "text/plain"
    }

    // Default fallback
    return browserMimeType || "application/octet-stream"
}

// PDF estimation (placeholder - would need actual PDF parsing library)
export async function estimatePdf(buffer: ArrayBuffer): Promise<{ pageCount: number; tokenCount: number }> {
    // This is a placeholder implementation
    // In a real implementation, you would use a PDF parsing library
    // For now, we'll estimate based on file size
    const sizeInMB = buffer.byteLength / (1024 * 1024);
    const estimatedPages = Math.ceil(sizeInMB * 2); // Rough estimate: 1MB ≈ 2 pages
    const estimatedTokens = Math.ceil(buffer.byteLength / 4); // Rough estimate: 1 token ≈ 4 bytes

    return {
        pageCount: estimatedPages,
        tokenCount: estimatedTokens
    };
}