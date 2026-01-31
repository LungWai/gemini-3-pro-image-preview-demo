import { apiConfig, type GcpConfig } from '../utils/apiConfig';
import { DEFAULT_REQUEST_TIMEOUT_MS } from './request';

import type {
  GeminiContentPart,
  GeminiInlineData,
  GeminiInlineDataInput,
  GeminiMessage,
  GeminiResponse,
  GeminiResult,
} from '@/types/gemini';

// Vertex AI uses a different request payload structure
type VertexAIRequestPayload = {
  contents: GeminiMessage[];
  generationConfig: {
    responseModalities?: Array<'TEXT' | 'IMAGE'>;
    maxOutputTokens?: number;
    imageConfig?: {
      aspectRatio?: string;
      imageSize?: string;
    };
  };
  tools?: Array<{ googleSearch?: Record<string, never> }>;
};

export class GcpGeminiClientError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown; cause?: unknown } = {}) {
    super(message);
    this.name = 'GcpGeminiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
  }
}

type GcpGeminiCallParams = {
  prompt: string;
  history?: GeminiMessage[];
  images?: GeminiInlineDataInput[];
  aspectRatio?: string;
  imageSize?: string;
  useSearch?: boolean;
};

/**
 * Build the Vertex AI endpoint URL
 * Format: https://{region}-aiplatform.googleapis.com/v1/projects/{projectId}/locations/{region}/publishers/google/models/{model}:generateContent
 */
const buildVertexAIEndpoint = (config: GcpConfig): string => {
  const { projectId, region, model } = config;
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;
};

/**
 * Build authorization header based on auth type
 */
const buildAuthHeader = (config: GcpConfig): Record<string, string> => {
  if (config.authType === 'access_token') {
    return { Authorization: `Bearer ${config.accessToken}` };
  }
  // For API key, use x-goog-api-key header
  return { 'x-goog-api-key': config.apiKey };
};

const cloneHistory = (history: GeminiMessage[] = []): GeminiMessage[] =>
  history
    .map((message) => ({
      role: message.role,
      parts: message.parts
        .filter((part) => {
          if (part.thought) return false;
          if (message.role === 'model') {
            const hasImage = part.inline_data || part.inlineData;
            if (hasImage) return false;
          }
          return true;
        })
        .map((part) => {
          const inlineData = part.inline_data || part.inlineData;
          return {
            ...(part.text ? { text: part.text } : {}),
            ...(inlineData ? { inline_data: inlineData } : {}),
          };
        }),
    }))
    .filter((message) => message.parts.length > 0);

const buildUserMessage = (prompt: string, images: GeminiInlineDataInput[] = []): GeminiMessage => {
  const parts: GeminiContentPart[] = [{ text: prompt }];
  images.forEach(({ data, mimeType }) => {
    if (!data) return;
    const inlineData: GeminiInlineData = {
      mime_type: mimeType || 'image/png',
      data,
    };
    parts.push({ inline_data: inlineData });
  });

  return { role: 'user', parts };
};

const getInlineData = (part?: GeminiContentPart): GeminiInlineData | undefined =>
  part?.inline_data || part?.inlineData;

const extractText = (response: GeminiResponse): string => {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const textSegments = parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text as string);

  return textSegments.length > 0 ? textSegments.join('\n\n') : '';
};

const extractImageData = (response: GeminiResponse): string | null => {
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inlineData = getInlineData(part);
    if (inlineData?.data) {
      return inlineData.data;
    }
  }
  return null;
};

const buildAssistantMessageParts = (
  response: GeminiResponse
): { parts: GeminiContentPart[]; textParts: Array<{ text: string }> } => {
  const parts: GeminiContentPart[] = [];
  const textParts: Array<{ text: string }> = [];

  const candidateParts = response.candidates?.[0]?.content?.parts || [];
  candidateParts.forEach((part) => {
    if (part.thought) return;

    if (part.text) {
      const textPart = { text: part.text };
      parts.push(textPart);
      textParts.push(textPart);
      return;
    }
    const inlineData = getInlineData(part);
    if (inlineData) {
      parts.push({ inline_data: inlineData });
    }
  });

  return { parts, textParts };
};

const toGcpError = (status: number, body: unknown): GcpGeminiClientError => {
  if (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)) {
    const payload = (body as { error?: { message?: string; status?: string; code?: string } }).error;
    const message = payload?.message || 'GCP API 请求失败';
    return new GcpGeminiClientError(message, {
      status,
      code: payload?.status || payload?.code,
      details: body,
    });
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return new GcpGeminiClientError(body, { status, details: body });
  }

  return new GcpGeminiClientError('GCP API 请求失败', { status, details: body });
};

const parseResponse = async (response: Response): Promise<GeminiResponse> => {
  const text = await response.text();

  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw toGcpError(response.status, parsed);
  }

  return (parsed || {}) as GeminiResponse;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const requestGcpGemini = async (
  payload: VertexAIRequestPayload,
  config: GcpConfig
): Promise<GeminiResponse> => {
  const endpoint = buildVertexAIEndpoint(config);
  const authHeader = buildAuthHeader(config);

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      },
      DEFAULT_REQUEST_TIMEOUT_MS
    );

    return parseResponse(response);
  } catch (error) {
    if (error instanceof GcpGeminiClientError) {
      throw error;
    }
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      throw new GcpGeminiClientError('请求超时（已等待 20 分钟）', { details: error });
    }
    throw new GcpGeminiClientError('网络请求失败', { details: error });
  }
};

const callGcpGeminiApi = async ({
  prompt,
  images = [],
  history = [],
  aspectRatio = '1:1',
  imageSize = '2K',
  useSearch = false,
}: GcpGeminiCallParams): Promise<GeminiResult> => {
  const config = apiConfig.getGcpConfig();

  if (!config.projectId) {
    throw new GcpGeminiClientError('Please configure GCP Project ID first');
  }

  const hasAuth = config.authType === 'api_key' ? !!config.apiKey : !!config.accessToken;
  if (!hasAuth) {
    throw new GcpGeminiClientError(
      config.authType === 'api_key' ? 'Please configure API Key first' : 'Please configure Access Token first'
    );
  }

  const safeHistory = cloneHistory(history);
  const userMessage = buildUserMessage(prompt, images);
  const contents = [...safeHistory, userMessage];

  const payload: VertexAIRequestPayload = {
    contents,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      maxOutputTokens: 8192,
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  if (useSearch) {
    payload.tools = [{ googleSearch: {} }];
  }

  const response = await requestGcpGemini(payload, config);
  const { parts, textParts } = buildAssistantMessageParts(response);

  const updatedHistory: GeminiMessage[] =
    parts.length > 0 ? [...contents, { role: 'model', parts }] : contents;

  return {
    text: extractText(response),
    parts: textParts,
    imageData: extractImageData(response),
    thinkingImages: [],
    groundingMetadata: response.groundingMetadata,
    history: updatedHistory,
  };
};

export const gcpGeminiClient = {
  generateImage: ({
    prompt,
    aspectRatio,
    imageSize,
    history,
  }: Omit<GcpGeminiCallParams, 'images' | 'useSearch'>) =>
    callGcpGeminiApi({ prompt, aspectRatio, imageSize, history }),

  editImage: ({
    imageData,
    editPrompt,
    aspectRatio,
    imageSize,
    history,
  }: {
    imageData: string;
    editPrompt: string;
    aspectRatio?: string;
    imageSize?: string;
    history?: GeminiMessage[];
  }) =>
    callGcpGeminiApi({
      prompt: editPrompt,
      images: [{ data: imageData, mimeType: 'image/png' }],
      aspectRatio,
      imageSize,
      history,
    }),

  compositeImages: ({
    prompt,
    imageDataList,
    aspectRatio,
    imageSize,
    history,
  }: {
    prompt: string;
    imageDataList: GeminiInlineDataInput[];
    aspectRatio?: string;
    imageSize?: string;
    history?: GeminiMessage[];
  }) =>
    callGcpGeminiApi({
      prompt,
      images: imageDataList,
      aspectRatio,
      imageSize,
      history,
    }),

  generateWithSearch: ({
    prompt,
    aspectRatio,
    imageSize,
    history,
  }: Omit<GcpGeminiCallParams, 'images' | 'useSearch'>) =>
    callGcpGeminiApi({
      prompt,
      aspectRatio,
      imageSize,
      history,
      useSearch: true,
    }),
};

