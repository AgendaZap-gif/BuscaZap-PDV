/**
 * Speech-to-Text - OpenAI Whisper.
 * Se OPENAI_API_KEY não estiver configurado, retorna erro.
 */

import { createReadStream } from "fs";
import { ENV } from "./env.js";

export interface TranscriptionResult {
  text: string;
  error?: string;
  code?: string;
  details?: string;
}

async function getOpenAI(): Promise<{ audio: { transcriptions: { create: (opts: { file: unknown; model: string }) => Promise<{ data: { text: string } }> } } } | null> {
  if (!ENV.openaiApiKey?.trim()) return null;
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey: ENV.openaiApiKey }) as unknown as { audio: { transcriptions: { create: (opts: { file: unknown; model: string }) => Promise<{ data: { text: string } }> } } };
}

export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  const openai = await getOpenAI();
  if (!openai) {
    return {
      text: "",
      error: "Voice transcription is disabled. Configure OPENAI_API_KEY for Whisper.",
      code: "SERVICE_DISABLED",
    };
  }
  try {
    const file = createReadStream(audioFilePath);
    const res = await openai.audio.transcriptions.create({
      file: file as unknown as File,
      model: "whisper-1",
    });
    const text = (res as { data?: { text?: string }; text?: string }).data?.text ?? (res as { text?: string }).text ?? "";
    return { text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      text: "",
      error: message,
      code: "TRANSCRIPTION_FAILED",
    };
  }
}

export function isVoiceTranscriptionConfigured(): boolean {
  return Boolean(ENV.openaiApiKey?.trim());
}
