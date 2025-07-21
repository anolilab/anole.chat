"use client";

import type { ThreadMessageLike } from "@assistant-ui/react";

import { 
    createThread, 
    getAllThreads as getAllThreadsFromDB,
    type ThreadDocument,
    type ThreadMetadata 
} from "../collections/threads-collection";
import { 
    createMessage, 
    convertToMessageDocument,
    type MessageDocument 
} from "../collections/messages-collection";

// Migration from old Map-based state to TanStack DB
export const migrateFromMapState = (
    threads: Map<string, ThreadMessageLike[]>,
    threadMetadata: Map<string, any>
) => {
    console.log("[Migration] Starting migration from Map state to TanStack DB");
    
    const migratedThreads: string[] = [];
    const migratedMessages: string[] = [];
    
    try {
        // Migrate threads
        for (const [threadId, messages] of threads.entries()) {
            if (threadId === "default") continue; // Skip default thread as it's already created
            
            // Get metadata for this thread
            const metadata = threadMetadata.get(threadId);
            
            // Create thread in TanStack DB
            createThread(threadId, {
                createdAt: metadata?.createdAt || new Date(),
                lastActivity: metadata?.lastActivity || new Date(),
                status: metadata?.status || "active",
                title: metadata?.title || "Migrated Thread",
                branchName: metadata?.branchName,
                branchPoint: metadata?.branchPoint,
                parentThreadId: metadata?.parentThreadId,
            });
            
            migratedThreads.push(threadId);
            
            // Migrate messages for this thread
            messages.forEach(message => {
                if (message && message.id && message.role && Array.isArray(message.content)) {
                    const messageDoc = convertToMessageDocument(message, threadId);
                    createMessage(messageDoc);
                    migratedMessages.push(message.id);
                }
            });
        }
        
        console.log("[Migration] Successfully migrated:", {
            threads: migratedThreads.length,
            messages: migratedMessages.length,
        });
        
        return {
            success: true,
            migratedThreads,
            migratedMessages,
        };
    } catch (error) {
        console.error("[Migration] Failed to migrate:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

// Check if migration is needed
export const needsMigration = (): boolean => {
    try {
        const existingThreads = getAllThreadsFromDB();
        // If we only have the default thread, migration might be needed
        return existingThreads.length <= 1;
    } catch (error) {
        console.warn("[Migration] Error checking migration status:", error);
        return false;
    }
};

// Validate migration
export const validateMigration = (
    originalThreads: Map<string, ThreadMessageLike[]>,
    originalMetadata: Map<string, any>
): boolean => {
    try {
        const migratedThreads = getAllThreadsFromDB();
        
        // Check if all threads were migrated
        for (const [threadId, messages] of originalThreads.entries()) {
            if (threadId === "default") continue;
            
            const migratedThread = migratedThreads.find(t => t.id === threadId);
            if (!migratedThread) {
                console.warn("[Migration] Thread not found after migration:", threadId);
                return false;
            }
            
            // Check if message count matches (rough validation)
            const originalMessageCount = messages.length;
            const migratedMessageCount = migratedThread.messages?.length || 0;
            
            if (originalMessageCount !== migratedMessageCount) {
                console.warn("[Migration] Message count mismatch for thread:", threadId, {
                    original: originalMessageCount,
                    migrated: migratedMessageCount,
                });
                return false;
            }
        }
        
        console.log("[Migration] Validation successful");
        return true;
    } catch (error) {
        console.error("[Migration] Validation failed:", error);
        return false;
    }
};

// Clean up old data after successful migration
export const cleanupOldData = (): void => {
    try {
        // Clear localStorage keys that might contain old data
        const keysToRemove = [
            "anole-threads-old",
            "anole-messages-old",
            "thread-metadata-old",
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log("[Migration] Removed old data key:", key);
            }
        });
        
        console.log("[Migration] Cleanup completed");
    } catch (error) {
        console.warn("[Migration] Cleanup failed:", error);
    }
};

// Full migration process
export const performFullMigration = async (
    threads: Map<string, ThreadMessageLike[]>,
    threadMetadata: Map<string, any>
): Promise<{ success: boolean; message: string }> => {
    console.log("[Migration] Starting full migration process");
    
    try {
        // Step 1: Perform migration
        const migrationResult = migrateFromMapState(threads, threadMetadata);
        
        if (!migrationResult.success) {
            return {
                success: false,
                message: `Migration failed: ${migrationResult.error}`,
            };
        }
        
        // Step 2: Validate migration
        const isValid = validateMigration(threads, threadMetadata);
        
        if (!isValid) {
            return {
                success: false,
                message: "Migration validation failed",
            };
        }
        
        // Step 3: Clean up old data
        cleanupOldData();
        
        return {
            success: true,
            message: `Successfully migrated ${migrationResult.migratedThreads.length} threads and ${migrationResult.migratedMessages.length} messages`,
        };
    } catch (error) {
        console.error("[Migration] Full migration process failed:", error);
        return {
            success: false,
            message: `Migration process failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
};