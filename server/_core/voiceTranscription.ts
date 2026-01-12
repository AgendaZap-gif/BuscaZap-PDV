/**
 * Voice Transcription - DISABLED
 * 
 * This module was previously using Manus Forge API.
 * To re-enable, integrate with OpenAI Whisper API directly.
 * 
 * Original backup: voiceTranscription.ts.backup
 * 
 * Example integration:
 * 
 * import OpenAI from 'openai';
 * import fs from 'fs';
 * 
 * const openai = new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 * 
 * const transcription = await openai.audio.transcriptions.create({
 *   file: fs.createReadStream("audio.mp3"),
 *   model: "whisper-1",
 * });
 */

export interface TranscriptionResult {
  text: string;
  error?: string;
  code?: string;
  details?: string;
}

export async function transcribeAudio(
  audioFilePath: string
): Promise<TranscriptionResult> {
  return {
    text: "",
    error: "Voice transcription is disabled. Please integrate with OpenAI Whisper API or similar service.",
    code: "SERVICE_DISABLED",
  };
}
