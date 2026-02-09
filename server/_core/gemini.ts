/**
 * Cliente Gemini para o BuscaZap-PDV (mesmo cérebro do app principal).
 * Usa GEMINI_API_KEY, GEMINI_MODEL e GEMINI_FALLBACK_MODEL.
 */

import { ENV } from "./env.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiRole = "user" | "model";

export type GeminiMessage = {
  role: GeminiRole;
  parts: Array<{ text: string }>;
};

export function isGeminiConfigured(): boolean {
  return Boolean(ENV.geminiApiKey?.trim());
}

function getModel(): string {
  return ENV.geminiModel || "models/gemini-2.5-flash";
}

function getFallbackModel(): string {
  return ENV.geminiFallbackModel || "models/gemini-2.5-pro";
}

export type GeminiChatParams = {
  systemInstruction?: string;
  messages: GeminiMessage[];
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export type GeminiChatResult = {
  text: string;
  model: string;
};

export async function geminiChat(params: GeminiChatParams): Promise<GeminiChatResult> {
  const apiKey = ENV.geminiApiKey?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = params.model ?? getModel();
  const url = `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: params.messages.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: m.parts,
    })),
    generationConfig: {
      maxOutputTokens: params.maxOutputTokens ?? 2048,
      temperature: params.temperature ?? 0.7,
    },
  };

  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }

  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok && model !== getFallbackModel()) {
    const fallbackUrl = `${BASE}/models/${encodeURIComponent(getFallbackModel())}:generateContent?key=${encodeURIComponent(apiKey)}`;
    res = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${res.statusText} – ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text: text.trim(), model };
}

export function toGeminiMessages(messages: Array<{ role: string; content: string }>): GeminiMessage[] {
  const out: GeminiMessage[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    const text = typeof m.content === "string" ? m.content : "";
    if (!text.trim()) continue;
    out.push({ role, parts: [{ text }] });
  }
  return out;
}

/** Partes multimodais: texto ou imagem inline (base64) */
type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Extrai texto de uma imagem usando visão do Gemini (OCR).
 * Útil para cardápios, catálogos, documentos escaneados.
 */
export async function geminiExtractTextFromImage(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const apiKey = ENV.geminiApiKey?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = getModel();
  const url = `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const parts: GeminiPart[] = [
    {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data.replace(/^data:image\/\w+;base64,/, ""),
      },
    },
    {
      text:
        "Extraia todo o texto visível desta imagem (cardápio, catálogo, documento). Retorne apenas o texto extraído, preservando a estrutura quando possível (listas, preços, títulos). Não adicione comentários ou formatação extra.",
    },
  ];

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.2,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} – ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}
