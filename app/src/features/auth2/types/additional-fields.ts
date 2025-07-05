import type { ReactNode } from "react"

export type FieldType = "string" | "number" | "boolean"

export interface AdditionalField {
    description?: ReactNode
    instructions?: ReactNode
    label: ReactNode
    placeholder?: string
    required?: boolean
    type: FieldType
    validate?: (value: string) => Promise<boolean>
}

export interface AdditionalFields {
    [key: string]: AdditionalField
}
