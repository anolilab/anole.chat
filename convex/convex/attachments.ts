import { R2 } from "@convex-dev/r2"
import { v } from "convex/values"
import { components } from "./_generated/api"
import { httpAction, mutation, query } from "./_generated/server"
import {
    MAX_FILE_SIZE,
    MAX_TOKENS_PER_FILE,
    estimateTokenCount,
    getCorrectMimeType,
    getFileTypeInfo,
    isSupportedFile
} from "./lib/file_constants"
import { getUserIdentity } from "./lib/identity"

export const r2 = new R2(components.r2)
// Direct file upload HTTP action for files under 5MB
export const uploadFile = httpAction(async (ctx, request) => {
    try {
        const user = await getUserIdentity(ctx, { allowAnons: false })
        if ("error" in user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            })
        }
        const formData = await request.formData()
        const file = formData.get("file") as Blob

        const fileName = formData.get("fileName") as string

        if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new Response(
                JSON.stringify({
                    error: `File size exceeds 5MB limit. Current size: ${file.size} bytes`
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        // Validate file type
        if (!isSupportedFile(fileName, file.type)) {
            return new Response(
                JSON.stringify({
                    error: `Unsupported file type: ${fileName}`
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        const fileTypeInfo = getFileTypeInfo(fileName, file.type)

        // Get arrayBuffer once for validation (for text files and PDFs)
        const fileBuffer = await file.arrayBuffer()
        // const bufferCopy = new ArrayBuffer(fileBuffer.byteLength)
        // new Uint8Array(bufferCopy).set(new Uint8Array(fileBuffer))

        // For text files, validate token count
        if (fileTypeInfo.isText && !fileTypeInfo.isImage) {
            try {
                const text = new TextDecoder().decode(fileBuffer)
                const tokenCount = estimateTokenCount(text)

                if (tokenCount > MAX_TOKENS_PER_FILE) {
                    return new Response(
                        JSON.stringify({
                            error: `File "${fileName}" exceeds ${MAX_TOKENS_PER_FILE.toLocaleString()} token limit (estimated: ${tokenCount.toLocaleString()} tokens)`
                        }),
                        {
                            status: 400,
                            headers: { "Content-Type": "application/json" }
                        }
                    )
                }
            } catch (error) {
                console.error("Error validating text file:", error)
                return new Response(
                    JSON.stringify({
                        error: `Error validating file content: ${fileName}`
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" }
                    }
                )
            }
        } else if (fileTypeInfo.isPdf) {
            // Some issue with the convex runtime. Might come back to this later but...
            // try {
            //     // Check page count
            //     console.log("Estimating PDF...")
            //     const { pageCount, tokenCount } = await estimatePdf(fileBuffer)
            //     console.log("PDF estimated", pageCount, tokenCount)
            //     if (pageCount > MAX_PDF_PAGES) {
            //         return new Response(
            //             JSON.stringify({
            //                 error: `PDF "${fileName}" exceeds ${MAX_PDF_PAGES} page limit (current: ${pageCount} pages)`
            //             }),
            //             {
            //                 status: 400,
            //                 headers: { "Content-Type": "application/json" }
            //             }
            //         )
            //     }
            //     // Check token count
            //     if (tokenCount > MAX_PDF_TOKENS) {
            //         return new Response(
            //             JSON.stringify({
            //                 error: `PDF "${fileName}" exceeds ${MAX_PDF_TOKENS.toLocaleString()} token limit (estimated: ${tokenCount.toLocaleString()} tokens)`
            //             }),
            //             {
            //                 status: 400,
            //                 headers: { "Content-Type": "application/json" }
            //             }
            //         )
            //     }
            // } catch (error) {
            //     console.error("Error validating PDF file:", error)
            //     return new Response(
            //             JSON.stringify({
            //                 error: `Error validating PDF content: ${fileName}`
            //             }),
            //             {
            //                 status: 400,
            //                 headers: { "Content-Type": "application/json" }
            //             }
            //         )
            //     }
            // }
        }

        // Generate unique key for the file
        const key = `attachments/${user.id}/${Date.now()}-${crypto.randomUUID()}-${fileName}`

        // Get the correct MIME type (handles browser inconsistencies)
        const mimeType = getCorrectMimeType(fileName, file.type)

        // Store file directly in R2
        const storedKey = await r2.store(ctx, new Uint8Array(fileBuffer), {
            key,
            type: mimeType
        })

        return new Response(
            JSON.stringify({
                key: storedKey,
                fileName: fileName,
                fileType: mimeType, // Return the corrected MIME type
                fileSize: file.size,
                uploadedAt: Date.now(),
                success: true
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )
    } catch (error) {
        console.error("Error uploading file:", error)
        return new Response(
            JSON.stringify({
                error: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }
})

// Get file metadata - now with auth check
export const getFileMetadata = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            //i guess if you have the key, you have the file anyway
            // so no auth here...
            const metadata = await r2.getMetadata(ctx, args.key)
            return metadata
        } catch (error) {
            console.error("Error getting file metadata:", error)
            return null
        }
    }
})

// Mutation to delete file - now with auth check
export const deleteFile = mutation({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            const user = await getUserIdentity(ctx, { allowAnons: false })
            if ("error" in user) {
                return {
                    success: false,
                    error: "Unauthorized"
                }
            }

            const metadata = await r2.getMetadata(ctx, args.key)
            if (!metadata) {
                return {
                    success: false,
                    error: "File not found"
                }
            }

            // For R2, we'll use the key to determine ownership
            // Files are stored with user ID in the key path
            if (!metadata.key.includes(`attachments/${user.id}/`)) {
                return {
                    success: false,
                    error: "Access denied: File does not belong to user"
                }
            }

            await r2.deleteObject(ctx, args.key)

            console.log("Successfully deleted file:", args.key)
            return { success: true }
        } catch (error) {
            console.error("Error deleting file:", error)
            return {
                success: false,
                error: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        }
    }
})

// List files for current user only
export const listFiles = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        try {
            const user = await getUserIdentity(ctx, { allowAnons: false })
            if ("error" in user) {
                return []
            }

            // List files for the specific user by filtering keys
            const allFiles = await r2.listMetadata(ctx, args.limit || 100)
            return allFiles.filter(file => file.key.includes(`attachments/${user.id}/`))
        } catch (error) {
            console.error("Error listing files:", error)
            return []
        }
    }
})

export const getFile = httpAction(async (ctx, req) => {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")
    if (!key) return new Response(null, { status: 400 })
    const file = await r2.getUrl(key)
    return Response.redirect(file)
})