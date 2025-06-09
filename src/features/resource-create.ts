"use server";

import { generateEmbeddings } from "@/features/ai-embedding";
import { db } from "@/lib/db";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
import { type NewResourceParams, insertResourceSchema, resources } from "@/lib/db/schema/resources";

export const createResource = async (input: NewResourceParams) => {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db.insert(resources).values({ content }).returning();

    const embeddings = await generateEmbeddings(content);
    const [dbContent] = await db
        .insert(embeddingsTable)
        .values(
            embeddings.map((embedding) => ({
                resourceId: resource.id,
                ...embedding,
            })),
        )
        .returning();

    return {
        id: dbContent.id,
        error: null,
    };
};
