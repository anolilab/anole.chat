import { openai } from "@ai-sdk/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embed, embedMany } from "ai";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 8000,
    chunkOverlap: 20,
    separators: ["\n\n", "\n", "."],
});

export const generateChunksBySplitter = async (input: string): Promise<string[]> => {
    const chunks = await splitter.splitText(input);
    return chunks;
};

const embeddingModel = openai.embedding("text-embedding-ada-002");

export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = await generateChunksBySplitter(value);
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll("\\n", " ");
    const { embedding } = await embed({
        model: embeddingModel,
        value: input,
    });
    return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
    const userQueryEmbedded = await generateEmbedding(userQuery);

    //const similarity = sql<number>`1 - (${cosineDistance(
    //embeddings.embedding,
    //userQueryEmbedded,
    //)})`;

    //const similarGuides = await db
    //.select({ name: embeddings.content, similarity })
    //.from(embeddings)
    //.where(gt(similarity, 0.5))
    //.orderBy((t) => desc(t.similarity))
    //.limit(4);

    return [];
};
