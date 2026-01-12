/**
 * LLM (Large Language Model) - DISABLED
 * 
 * This module was previously using Manus Forge API.
 * To re-enable, integrate with OpenAI API directly.
 * 
 * Original backup: llm.ts.backup
 * 
 * Example integration:
 * 
 * import OpenAI from 'openai';
 * 
 * const openai = new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 * 
 * const completion = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function chatCompletion(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  throw new Error("LLM is disabled. Please integrate with OpenAI API or similar service.");
}

export async function streamChatCompletion(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<AsyncIterable<string>> {
  throw new Error("LLM streaming is disabled. Please integrate with OpenAI API or similar service.");
}
