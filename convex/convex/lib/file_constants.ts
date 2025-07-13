// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_TOKENS_PER_FILE = 100000; // 100k tokens
export const MAX_PDF_PAGES = 50;
export const MAX_PDF_TOKENS = 50000; // 50k tokens for PDFs

// Supported file types
const SUPPORTED_TEXT_EXTENSIONS = [
    '.txt', '.md', '.json', '.csv', '.tsv', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx',
    '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
    '.kt', '.scala', '.r', '.m', '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat',
    '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.tex', '.rst', '.adoc'
];

const SUPPORTED_IMAGE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'
];

const SUPPORTED_PDF_EXTENSIONS = ['.pdf'];

// MIME type mappings
const MIME_TYPE_MAP: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.jsx': 'text/jsx',
    '.tsx': 'text/tsx',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.cpp': 'text/x-c++src',
    '.c': 'text/x-csrc',
    '.h': 'text/x-chdr',
    '.hpp': 'text/x-c++hdr',
    '.cs': 'text/x-csharp',
    '.php': 'application/x-httpd-php',
    '.rb': 'text/x-ruby',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.swift': 'text/x-swift',
    '.kt': 'text/x-kotlin',
    '.scala': 'text/x-scala',
    '.r': 'text/x-r',
    '.m': 'text/x-objective-c',
    '.sql': 'text/x-sql',
    '.sh': 'application/x-sh',
    '.bash': 'application/x-sh',
    '.zsh': 'application/x-sh',
    '.fish': 'application/x-sh',
    '.ps1': 'application/x-powershell',
    '.bat': 'application/x-msdos-program',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.toml': 'application/toml',
    '.ini': 'text/plain',
    '.cfg': 'text/plain',
    '.conf': 'text/plain',
    '.log': 'text/plain',
    '.tex': 'application/x-tex',
    '.rst': 'text/x-rst',
    '.adoc': 'text/asciidoc',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.pdf': 'application/pdf'
};

export function isSupportedFile(fileName: string, mimeType: string): boolean {
    const extension = getFileExtension(fileName).toLowerCase();
    return SUPPORTED_TEXT_EXTENSIONS.includes(extension) ||
        SUPPORTED_IMAGE_EXTENSIONS.includes(extension) ||
        SUPPORTED_PDF_EXTENSIONS.includes(extension);
}

export function getFileTypeInfo(fileName: string, mimeType: string) {
    const extension = getFileExtension(fileName).toLowerCase();
    const isText = SUPPORTED_TEXT_EXTENSIONS.includes(extension);
    const isImage = SUPPORTED_IMAGE_EXTENSIONS.includes(extension);
    const isPdf = SUPPORTED_PDF_EXTENSIONS.includes(extension);

    return {
        isText,
        isImage,
        isPdf,
        extension
    };
}

export function getCorrectMimeType(fileName: string, browserMimeType: string): string {
    const extension = getFileExtension(fileName).toLowerCase();
    const mappedMimeType = MIME_TYPE_MAP[extension];

    // Use mapped MIME type if available, otherwise fall back to browser MIME type
    return mappedMimeType || browserMimeType || 'application/octet-stream';
}

export function getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
}

// Simple token estimation (rough approximation)
export function estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
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