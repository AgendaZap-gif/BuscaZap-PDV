/**
 * LLM (Large Language Model) — Gemini
 * Usa GEMINI_API_KEY quando configurado (cérebro BuscaZap).
 */

import { geminiChat, toGeminiMessages, isGeminiConfigured } from "./gemini.js";

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
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY não configurado. Configure no .env para usar IA.");
  }
  const systemMsg = messages.find((m) => m.role === "system");
  const conversation = messages.filter((m) => m.role !== "system");
  const geminiMessages = toGeminiMessages(conversation);
  const result = await geminiChat({
    systemInstruction: systemMsg?.content,
    messages: geminiMessages,
    temperature: options.temperature,
    maxOutputTokens: options.max_tokens,
  });
  return result.text;
}

export async function streamChatCompletion(
  messages: LLMMessage[],
  _options: LLMOptions = {}
): Promise<AsyncIterable<string>> {
  const text = await chatCompletion(messages, _options);
  return (async function* () {
    yield text;
  })();
}
