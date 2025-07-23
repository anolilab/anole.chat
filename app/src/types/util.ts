import type { JSONSchema7 } from "json-schema";

export type ObjectJsonSchema7 = {
    description?: string;
    properties: {
        [key: string]: JSONSchema7;
    };
    required?: string[];
    type: "object";
};

export type TipTapMentionJsonContentPart
    = | {
        text: string;
        type: "text";
    }
    | {
        attrs: {
            id: string;
            label: string;
        };
        type: "mention";
    };

export type TipTapMentionJsonContent = {
    content: {
        content?: (
            | {
                text: string;
                type: "text";
            }
            | {
                attrs: {
                    id: string;
                    label: string;
                };
                type: "mention";
            }
            | {
                type: "hardBreak";
            }
        )[];
        type: "paragraph";
    }[];
    type: "doc";
};
