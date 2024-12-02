// Practice from : https://www.notion.so/m33/I-know-how-to-use-Tool-Calling-to-get-a-desired-response-format-9eaa0b9ca5844a10b9e382b087b1185d?pvs=4

import fs from "fs";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/index.mjs";
import { z } from "zod";

import { environment } from "../../environment.js";
import { zodFunction } from "openai/helpers/zod.mjs";

const client = new OpenAI({ apiKey: environment.openaiApiKey });

type GetToolParams = {
  name: string;
  description: string;
  zodSchema: z.Schema;
};

const catToolSchema = z.object({
  path: z.string().describe("The path to the file"),
});

const catTool: ChatCompletionTool = zodFunction({
  name: "cat_command",
  description:
    "Reads the content of a file. Only works on files and not directories, files have extensions at the end of their name.",
  parameters: catToolSchema,
});

// First API call
const completion = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: "Explain to me the content of my typescript config.",
    },
  ],
  tools: [catTool],
  tool_choice: { type: "function", function: { name: "cat_command" } },
});

const toolCall = completion.choices[0].message.tool_calls?.[0];
if (
  (completion.choices[0].finish_reason !== "tool_calls" &&
    completion.choices[0].finish_reason !== "stop") ||
  !toolCall
) {
  throw new Error("No tool call found in completion");
}

const parsedArguments = catToolSchema.parse(
  JSON.parse(toolCall.function.arguments)
);

// Execute the tool
const fileContent = fs.readFileSync(parsedArguments.path, "utf-8");

// Second API call with the response
const finalCompletion = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: "Explain to me the content of my typescript config.",
    },
    {
      role: "assistant",
      tool_calls: [toolCall],
    },
    {
      role: "tool",
      tool_call_id: toolCall.id,
      content: fileContent,
    },
  ],
});

const response = finalCompletion.choices[0].message.content;

console.log(response);
