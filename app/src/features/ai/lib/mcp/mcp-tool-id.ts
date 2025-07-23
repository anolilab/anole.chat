/**
 * Sanitizes a name to be compatible with function name requirements:
 * - Must start with a letter or underscore
 * - Can only contain alphanumeric characters, underscores, dots, or dashes
 * - Maximum length of 124 characters
 */
export const sanitizeFunctionName = (name: string): string => {
    // Replace any characters that aren't alphanumeric, underscore, dot, or dash with underscore
    let sanitized = name.replaceAll(/[^\w.\-]/g, "_");

    // Ensure it starts with a letter or underscore
    if (!/^[a-z_]/i.test(sanitized)) {
        sanitized = `_${sanitized}`;
    }

    // Truncate to 124 characters if needed
    if (sanitized.length > 124) {
        sanitized = sanitized.slice(0, 124);
    }

    return sanitized;
};

export const createMCPToolId = (serverName: string, toolName: string) => {
    // Sanitize both server name and tool name individually
    const sanitizedServer = sanitizeFunctionName(serverName);
    const sanitizedTool = sanitizeFunctionName(toolName);

    // Ensure the combined name doesn't exceed 124 characters
    // Reserve some characters for the separator
    const maxLength = 124;
    const separator = "_";

    if (sanitizedServer.length + sanitizedTool.length + separator.length > maxLength) {
        // Allocate space proportionally
        const totalLength = sanitizedServer.length + sanitizedTool.length;
        const serverPortion = Math.floor((sanitizedServer.length / totalLength) * (maxLength - separator.length));
        const toolPortion = maxLength - separator.length - serverPortion;

        return `${sanitizedServer.slice(0, Math.max(0, serverPortion))}${separator}${sanitizedTool.slice(0, Math.max(0, toolPortion))}`;
    }

    return `${sanitizedServer}${separator}${sanitizedTool}`;
};

export const extractMCPToolId = (toolId: string) => {
    const [serverName, ...toolName] = toolId.split("_");

    return { serverName, toolName: toolName.join("_") };
};
