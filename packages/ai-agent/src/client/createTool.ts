import type { Schema, Tool, ToolExecutionOptions, ToolSet } from "ai";
import { tool } from "ai";
import { z } from "zod";
import type { Agent } from "./index";
import type { RunActionCtx } from "./types";

export type ToolCtx<TOOLS extends ToolSet = ToolSet> = RunActionCtx & {
  agent: Agent<TOOLS>;
  userId?: string;
  threadId?: string;
  messageId?: string;
};

/**
 * This is a wrapper around the ai.tool function that adds extra context to the
 * tool call, including the action context, userId, threadId, and messageId.
 * @param tool The tool. See https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
 * but swap parameters for args and handler for execute.
 * @returns A tool to be used with the AI SDK.
 */
export function createTool<PARAMETERS extends ToolParameters, RESULT>(t: {
  /**
  An optional description of what the tool does.
  Will be used by the language model to decide whether to use the tool.
  Not used for provider-defined tools.
     */
  description?: string;
  /**
  The schema of the input that the tool expects. The language model will use this to generate the input.
  It is also used to validate the output of the language model.
  Use descriptions to make the input understandable for the language model.
     */
  args: PARAMETERS;
  /**
  An async function that is called with the arguments from the tool call and produces a result.
  If not provided, the tool will not be executed automatically.

  @args is the input of the tool call.
  @options.abortSignal is a signal that can be used to abort the tool call.
     */
  handler: (
    ctx: ToolCtx,
    args: inferParameters<PARAMETERS>,
    options: ToolExecutionOptions
  ) => PromiseLike<RESULT>;
  ctx?: ToolCtx;
}): Tool<PARAMETERS, RESULT> & {
  execute: (
    args: inferParameters<PARAMETERS>,
    options: ToolExecutionOptions
  ) => PromiseLike<RESULT>;
} {
  const args = {
    __acceptsCtx: true,
    ctx: t.ctx,
    description: t.description,
    parameters: t.args,
    async execute(
      args: inferParameters<PARAMETERS>,
      options: ToolExecutionOptions
    ) {
      if (!this.ctx) {
        throw new Error(
          "To use a Convex tool, you must either provide the ctx" +
            " at definition time (dynamically in an action), or use the Agent to" +
            " call it (which injects the ctx, userId and threadId)"
        );
      }
      return t.handler(this.ctx, args, options);
    },
  };
  return tool(args);
}

export function wrapTools(
  ctx: ToolCtx,
  ...toolSets: (ToolSet | undefined)[]
): ToolSet {
  const output = {} as ToolSet;
  for (const toolSet of toolSets) {
    if (!toolSet) {
      continue;
    }
    for (const [name, tool] of Object.entries(toolSet)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(tool as any).__acceptsCtx) {
        output[name] = tool;
      } else {
        const out = { ...tool, ctx };
        output[name] = out;
      }
    }
  }
  return output;
}

// Vendoring in from "ai" package since it wasn't exported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolParameters = z.ZodTypeAny | Schema<any>;
type inferParameters<PARAMETERS extends ToolParameters> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PARAMETERS extends Schema<any>
    ? PARAMETERS["_type"]
    : PARAMETERS extends z.ZodTypeAny
      ? z.infer<PARAMETERS>
      : never;
