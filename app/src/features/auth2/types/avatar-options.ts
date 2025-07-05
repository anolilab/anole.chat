export type AvatarOptions = {
    /**
     * Upload an avatar image and return the URL string
     * @remarks `(file: File) => Promise<string>`
     */
    upload?: (file: File) => Promise<string | undefined | null>
    /**
     * Avatar size for resizing
     * @default 128 (or 256 if upload is provided)
     */
    size: number
    /**
     * File extension for avatar uploads
     * @default "png"
     */
    extension: string
}
