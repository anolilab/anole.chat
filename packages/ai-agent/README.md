# Convex Agent Component

[![npm version](https://badge.fury.io/js/@convex-dev%2fagent.svg)](https://badge.fury.io/js/@convex-dev%2fagent)

<!-- START: Include on https://convex.dev/components -->

AI Agent framework built on Convex.

- Automatic storage of chat history, per-user or per-thread, that can span multiple agents.
- Playground UI for testing, debugging, and development. See [playground/README.md](playground/README.md) for more.
- RAG for chat context, via hybrid text & vector search, with configuration options.
  Use the API to query the history yourself and do it your way.
- Opt-in search for messages from other threads (for the same specified user).
- Support for generating / streaming objects and storing them in messages (as JSON).
- Tool calls via the AI SDK, along with Convex-specific tool wrappers.
- Easy integration with the [Workflow component](https://convex.dev/components/workflow).
  Enables long-lived, durable workflows defined as code.
- Reactive & realtime updates from asynchronous functions / workflows.
- Support for streaming text and storing the final result.
  See [examples/chat-streaming](./examples/chat-streaming/README.md).
- Rate limiting for chat messages and token usage via the
  [Rate Limiter component](https://convex.dev/components/rate-limiter).
  See [examples/rate-limiting](./examples/rate-limiting/README.md).
- Optionally filter tool calls out of the thread history.

[Read the associated Stack post here](https://stack.convex.dev/ai-agents).

[![Powerful AI Apps Made Easy with the Agent Component](https://img.youtube.com/vi/tUKMPUlOCHY/0.jpg)](https://www.youtube.com/watch?v=tUKMPUlOCHY)

Play with the [examples](./examples/) by cloning this repo and running:
```sh
npm run example
```

## Example usage:

```ts
// Define an agent similarly to the AI SDK
const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: "You are a helpful assistant.",
  tools: { accountLookup, fileTicket, sendEmail },
});

// Use the agent from within a normal action:
export const createThreadAndPrompt = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const userId = await getUserId(ctx);
    // Start a new thread for the user.
    const { threadId, thread } = await supportAgent.createThread(ctx, { userId});
    // Creates a user message with the prompt, and an assistant reply message.
    const result = await thread.generateText({ prompt });
    return { threadId, text: result.text };
  },
});

// Pick up where you left off, with the same or a different agent:
export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // Continue a thread, picking up where you left off.
    const { thread } = await anotherAgent.continueThread(ctx, { threadId });
    // This includes previous message history from the thread automatically.
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
```

Also see the [Stack article](https://stack.convex.dev/ai-agents).

Found a bug? Feature request? [File it here](https://github.com/get-convex/agent/issues).

## Pre-requisite: Convex

You'll need an existing Convex project to use the component.
Convex is a hosted backend platform, including a database, serverless functions,
and a ton more you can learn about [here](https://docs.convex.dev/get-started).

Run `npm create convex` or follow any of the [quickstarts](https://docs.convex.dev/home) to set one up.

## Installation

Install the component package:

```ts
npm install @convex-dev/agent
```

Create a `convex.config.ts` file in your app's `convex/` folder and install the component by calling `use`:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);

export default app;
```

## Usage

### Creating the agent

```ts
import { tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "./_generated/api";

// Define an agent similarly to the AI SDK
const supportAgent = new Agent(components.agent, {
  // The chat completions model to use for the agent.
  chat: openai.chat("gpt-4o-mini"),
  // The default system prompt if not overriden.
  instructions: "You are a helpful assistant.",
  tools: {
    // Convex tool
    myConvexTool: createTool({
      description: "My Convex tool",
      args: z.object({...}),
      // Note: annotate the return type of the handler to avoid type cycles.
      handler: async (ctx, args): Promise<string> => {
        return "Hello, world!";
      },
    }),
    // Standard AI SDK tool
    myTool: tool({ description, parameters, execute: () => {}}),
  },
  // Embedding model to power vector search of message history (RAG).
  textEmbedding: openai.embedding("text-embedding-3-small"),
  // Used for fetching context messages. See [below](#configuring-the-context-of-messages)
  contextOptions,
  // Used for storing messages. See [below](#configuring-the-storage-of-messages)
  storageOptions,
  // Used for limiting the number of steps when tool calls are involved.
  // NOTE: if you want tool calls to happen automatically with a single call,
  // you need to set this to something greater than 1 (the default).
  maxSteps: 1,
  // Used for limiting the number of retries when a tool call fails. Default: 3.
  maxRetries: 3,
  // Used for tracking token usage. See [below](#tracking-token-usage)
  usageHandler: async (ctx, { model, usage }) => {
    // ... log, save usage to your database, etc.
  },
});
```

### Starting a thread

You can start a thread from either an action or a mutation.
If it's in an action, you can also start sending messages.
The threadId allows you to resume later and maintain message history.
If you specify a userId, the thread will be associated with that user and messages will be saved to the user's history.
You can also search the user's history for relevant messages in this thread.

```ts
// Use the agent from within a normal action:
export const createThread = mutation({
  args: {},
  handler: async (ctx): Promise<{ threadId: string }> => {
    const userId = await getUserId(ctx);
    // Start a new thread for the user.
    const { threadId } = await supportAgent.createThread(ctx, { userId });
    return { threadId };
  },
});
```

### Continuing a thread

If you specify a userId too, you can search the user's history for relevant messages
to include in the prompt context.

```ts
// Pick up where you left off:
export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }): Promise<string> => {
    await authorizeThreadAccess(ctx, threadId);
    // This includes previous message history from the thread automatically.
+   const { thread } = await supportAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
```

### Generating text

The arguments to `generateText` are the same as the AI SDK, except you don't
have to provide a model. By default it will use the agent's chat model.

```ts
const { thread } = await supportAgent.createThread(ctx);
// OR
const { thread } = await supportAgent.continueThread(ctx, { threadId });

const result = await thread.generateText({ prompt });
```

### Generating an object

Similar to the AI SDK, you can generate or streaman object.
The same arguments apply, except you don't have to provide a model.
It will use the agent's default chat model.

```ts
import { z } from "zod";

const result = await thread.generateObject({
  prompt: "Generate a plan based on the conversation so far",
  schema: z.object({...}),
});
```

### Showing messages

Fetch the full messages directly. These will include things like usage, etc.

Server-side:

```ts
import type { MessageDoc } from "@convex-dev/agent";
import { paginationOptsValidator, type PaginationResult } from "convex/server";

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    //... other arguments you want
  },
  handler: async (
    ctx, { threadId, paginationOpts },
  ): PaginationResult<MessageDoc> => {
    // await authorizeThreadAccess(ctx, threadId);
    const paginated = await agent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });
    // Here you could filter out / modify the documents
    return paginated;
  },
});
```

Client-side:

```tsx
import { api } from "../convex/_generated/api";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";

function MyComponent({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(
    api.chatBasic.listThreadMessages,
    { threadId },
    { initialNumItems: 10 },
  );
  return (
    <div>
      {toUIMessages(messages.results ?? []).map((message) => (
        <div key={message.key}>{message.content}</div>
      ))}
    </div>
  );
}
```

See [examples/chat-basic](./examples/chat-basic) for an example, and
[examples/chat-streaming](./examples/chat-streaming) for a streaming example.

### Configuring the context of message generation

You can customize what history is included per-message via `contextOptions`.
These options can be provided to the Agent constructor, or per-message.

```ts
const result = await thread.generateText({ prompt }, {
  // Values shown are the defaults.
  contextOptions: {
    // Whether to exclude tool messages in the context.
    excludeToolMessages: true,
    // How many recent messages to include. These are added after the search
    // messages, and do not count against the search limit.
    recentMessages: 100,
    // Options for searching messages via text and/or vector search.
    searchOptions: {
      limit: 10, // The maximum number of messages to fetch.
      textSearch: false, // Whether to use text search to find messages.
      vectorSearch: false, // Whether to use vector search to find messages.
      // Note, this is after the limit is applied.
      // E.g. this will quadruple the number of messages fetched.
      // (two before, and one after each message found in the search)
      messageRange: { before: 2, after: 1 },
    },
    // Whether to search across other threads for relevant messages.
    // By default, only the current thread is searched.
    searchOtherThreads: false,
  },
```

### Configuring the storage of messages

Generally the defaults are fine, but if you want to pass in multiple messages
and have them all saved (vs. just the last one), or avoid saving any input
or output messages, you can pass in a `storageOptions` object, either to the
Agent constructor or per-message.

The usecase for passing in multiple messages but not saving them is if you want
to include some extra messages for context to the LLM, but only the last message
is the user's actual request. e.g. `messages = [...messagesFromRag, messageFromUser]`.
The default is to save the prompt and all output messages.

```ts
const result = await thread.generateText({ messages }, {
  storageOptions: {
    saveMessages: "all" | "none" | "promptAndOutput";
  },
});
```

### Creating a tool with Convex context

There are two ways to create a tool that has access to the Convex context.

1. Use the `createTool` function, which is a wrapper around the AI SDK's `tool` function.

```ts
export const ideaSearch = createTool({
  description: "Search for ideas in the database",
  args: z.object({ query: z.string() }),
  handler: async (ctx, args): Promise<Array<Idea>> => {
    // ctx has userId, threadId, messageId, runQuery, runMutation, and runAction
    const ideas = await ctx.runQuery(api.ideas.searchIdeas, { query: args.query });
    console.log("found ideas", ideas);
    return ideas;
  },
});
```

2. Define tools at runtime in a context with the variables you want to use.

```ts
async function createTool(ctx: ActionCtx, teamId: Id<"teams">) {
  const myTool = tool({
    description: "My tool",
    parameters: z.object({...}),
    execute: async (args, options) => {
      return await ctx.runQuery(internal.foo.bar, args);
    },
  });
}
```

You can provide tools at different times:

- Agent contructor: (`new Agent(components.agent, { tools: {...} })`)
- Creating a thread: `createThread(ctx, { tools: {...} })`
- Continuing a thread: `continueThread(ctx, { tools: {...} })`
- On thread functions: `thread.generateText({ tools: {...} })`
- Outside of a thread: `supportAgent.generateText(ctx, {}, { tools: {...} })`

Specifying tools at each layer will overwrite the defaults.
The tools will be `args.tools ?? thread.tools ?? agent.options.tools`.
This allows you to create tools in a context that is convenient.

### Saving messages then generate asynchronously

You can save messages in a mutation, then do the generation asynchronously.
This is recommended for a few reasons:
1. You can set up optimistic UI updates on mutations that are transactional, so
  the message will be shown optimistically until the message is saved and
  present in your message query.

To do this, you need to first save the message, then pass the `messageId` as
`promptMessageId` to generate / stream text.

Note: embeddings are usually generated automatically when you save messages from
an action. However, if you're saving messages in a mutation, where calling
an LLM is not possible, you can generate them asynchronously as well.

```ts
export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const userId = await getUserId(ctx);
    const { messageId } = await agent.saveMessage(ctx, {
      threadId, userId, prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.example.myAsyncAction, {
      threadId, promptMessageId: messageId,
    });
  }
});

export const myAsyncAction = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    // Generate embeddings for the prompt message
    await supportAgent.generateAndSaveEmbeddings(ctx, { messageIds: [promptMessageId] });
    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    await thread.generateText({ promptMessageId });
  },
});
```

### Search for messages

This is what the agent does automatically, but it can be useful to do manually, e.g. to find custom context to include.

Fetch Messages for a user and/or thread.
Accepts ContextOptions, e.g. excludeToolMessages, searchOptions, etc.
If you provide a `beforeMessageId`, it will only fetch messages from before that message.

```ts
import type { MessageDoc } from "@convex-dev/agent";

const messages: MessageDoc[] = await supportAgent.fetchContextMessages(ctx, {
  threadId, messages: [{ role, content }], contextOptions
});
```

### Get and update thread information

List threads for a user:

```ts
const threads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
  userId,
  order: "desc",
  paginationOpts: { cursor: null, numItems: 10 }
});
```

Get a thread by id:

```ts
const thread = await ctx.runQuery(components.agent.threads.getThread, {
  threadId,
});
```

Update a thread's metadata:

```ts
await ctx.runMutation(components.agent.threads.updateThread, {
  threadId,
  { title, summary, status }
});
```

## Using the Playground UI

The Playground UI is a simple way to test, debug, and develop with the agent.
- First configure it with instructions [here](./playground/README.md).
- Then you can use the [hosted version on GitHub pages](https://get-convex.github.io/agent/)
or run it locally with `npx @convex-dev/agent-playground`.

![Playground UI Screenshot](./playground/public/screenshot.png)

## Using the Workflow component for long-lived durable workflows

The [Workflow component](https://convex.dev/components/workflow) is a great way to build long-lived, durable workflows.
It handles retries and guarantees of eventually completing, surviving server restarts, and more.
Read more about durable workflows in [this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

To use the agent alongside workflows, you can run indivdual idempotent steps
that the workflow can run, each with configurable retries, with guarantees that
the workflow will eventually complete. Even if the server crashes mid-workflow,
the workflow will pick up from where it left off and run the next step. If a
step fails and isn't caught by the workflow, the workflow's onComplete handler
will get the error result.

### Exposing the agent as Convex actions

You can expose the agent's capabilities as Convex functions to be used as steps
in a workflow.

To create a thread as a standalone mutation, similar to `agent.createThread`:

```ts
export const createThread = supportAgent.createThreadMutation();
```

For an action that generates text in a thread, similar to `thread.generateText`:

```ts
export const getSupport = supportAgent.asTextAction({
  maxSteps: 10,
});
```

You can also expose a standalone action that generates an object.

```ts
export const getStructuredSupport = supportAgent.asObjectAction({
  schema: z.object({
    analysis: z.string().describe("A detailed analysis of the user's request."),
    suggestion: z.string().describe("A suggested action to take.")
  }),
});
```

To save messages explicitly as a mutation, similar to `agent.saveMessages`:

```ts
export const saveMessages = supportAgent.asSaveMessagesMutation();
```

This is useful for idempotency, as you can first create the user's message,
then generate a response in an unreliable action with retries, passing in the
existing messageId instead of a prompt.

### Using the agent actions within a workflow

You can use the [Workflow component](https://convex.dev/components/workflow)
to run agent flows. It handles retries and guarantees of eventually completing,
surviving server restarts, and more. Read more about durable workflows
[in this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

```ts
const workflow = new WorkflowManager(components.workflow);

export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }) => {
    const { threadId } = await step.runMutation(internal.example.createThread, {
      userId, title: "Support Request",
    });
    const suggestion = await step.runAction(internal.example.getSupport, {
      threadId, userId, prompt,
    });
    const { object } = await step.runAction(internal.example.getStructuredSupport, {
      userId, message: suggestion,
    });
    await step.runMutation(internal.example.sendUserMessage, {
      userId, message: object.suggestion,
    });
  },
});
```

See another example in [example.ts](./example/convex/example.ts#L120).

## Extra control: how to do more things yourself

### Generating text for a user without an associated thread

```ts
const result = await supportAgent.generateText(ctx, { userId }, { prompt });
```

### Saving messages manually

Save messages to the database.

```ts
const { lastMessageId, messageIds} = await agent.saveMessages(ctx, {
  threadId, userId,
  messages: [{ role, content }],
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
});
```

### Manage embeddings

Generate embeddings for a set of messages.

```ts
const embeddings = await supportAgent.generateEmbeddings([
  { role: "user", content: "What is love?" },
]);
```

Get and update embeddings, e.g. for a migration to a new model.

```ts
const messages = await ctx.runQuery(
  components.agent.vector.index.paginate,
  { vectorDimension: 1536, cursor: null, limit: 10 }
);
```

Note: If the dimension changes, you need to delete the old and insert the new.

```ts
const messages = await ctx.runQuery(components.agent.vector.index.updateBatch, {
  vectors: [
    { model: "gpt-4o-mini", vector: embedding, id: msg.embeddingId },
  ],
});
```

Delete embeddings

```ts
await ctx.runMutation(components.agent.vector.index.deleteBatch, {
  ids: [embeddingId1, embeddingId2],
});
```

Insert embeddings

```ts
const ids = await ctx.runMutation(
  components.agent.vector.index.insertBatch, {
    vectorDimension: 1536,
    vectors: [
      {
        model: "gpt-4o-mini",
        table: "messages",
        userId: "123",
        threadId: "123",
        vector: embedding,
        // Optional, if you want to update the message with the embeddingId
        messageId: messageId,
      },
    ],
  }
);
```

See example usage in [example.ts](./example/convex/example.ts).
Read more in [this Stack post](https://stack.convex.dev/ai-agents).

```sh
npm i @convex-dev/agent
```

### Tracking token usage

You can provide a `usageHandler` to the agent to track token usage.
See an example in
[this demo](https://github.com/ianmacartney/ai-agent-chat/blob/main/convex/chat.ts)
that captures usage to a table, then scans it to generate per-user invoices.

You can provide a `usageHandler` to the agent, per-thread, or per-message.

```ts
const supportAgent = new Agent(components.agent, {
  ...
  usageHandler: async (ctx, args) => {
    const {
      // Who used the tokens
      userId, threadId, agentName,
      // What LLM was used
      model, provider,
      // How many tokens were used (extra info is available in providerMetadata)
      usage, providerMetadata
    } = args;
    // ... log, save usage to your database, etc.
  },
});
```

Tip: Define the `usageHandler` within a function where you have more variables
available to attribute the usage to a different user, team, project, etc.

### Logging the raw request and response

You can provide a `rawRequestResponseHandler` to the agent to log the raw request and response from the LLM.

You could use this to log the request and response to a table, or use console logs with
[Log Streaming](https://docs.convex.dev/production/integrations/log-streams/)
to allow debugging and searching through Axiom or another logging service.

```ts
const supportAgent = new Agent(components.agent, {
  ...
  rawRequestResponseHandler: async (ctx, { request, response }) => {
    console.log("request", request);
    console.log("response", response);
  },
});
```

## Troubleshooting

### Circular dependencies

Having the return value of workflows depend on other Convex functions can lead to circular dependencies due to the
`internal.foo.bar` way of specifying functions. The way to fix this is to explicitly type the return value of the
workflow. When in doubt, add return types to more `handler` functions, like this:

```diff
 export const supportAgentWorkflow = workflow.define({
   args: { prompt: v.string(), userId: v.string(), threadId: v.string() },
+  handler: async (step, { prompt, userId, threadId }): Promise<string> => {
     // ...
   },
 });

 // And regular functions too:
 export const myFunction = action({
   args: { prompt: v.string() },
+  handler: async (ctx, { prompt }): Promise<string> => {
     // ...
   },
 });
```


<!-- END: Include on https://convex.dev/components -->
[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/get-convex/agent)
