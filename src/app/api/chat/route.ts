import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { createResource } from "~/actions/resources/create-resource.action";
import { findRelevantContent } from "~/lib/ai/embeddings";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful assistant. You MUST check your knowledge base before answering any questions by using your tool "getInformation".
    ALWAYS AND ONLY RESPOND TO QUESTIONS USING INFORMATION FROM TOOL CALLS.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know"`,
    messages,
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description: `Get information from your knowledge base to answer questions. This tool will return an array of JSON objects with the following format:
        [
          {
            "name": "The name of the resource or content",
            "similarity": "The similarity score of the resource or content to the user's question"
          }
        ]

        You MUST use the information from the tool call to answer the user's question. Rank higher similarity scores first. And if you are not confident, tell the user you don't know.
        `,
        parameters: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => {
          const relevantContent = await findRelevantContent(question);
          console.log("question", question);
          console.log("relevantContent", relevantContent);
          return relevantContent;
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
