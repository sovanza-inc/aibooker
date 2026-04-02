import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Platform authentication.
 * Expects: Authorization: Bearer <api_key>
 * The api_key must match an active integration's apiKey.
 *
 * For now we also accept a special master key from env for testing.
 */
export function getAiPlatformFromRequest(request: NextRequest): string | null {
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const platform = request.headers.get('x-ai-platform')?.toLowerCase();

  if (platform) return platform;
  if (ua.includes('openai') || ua.includes('chatgpt')) return 'openai';
  if (ua.includes('claude') || ua.includes('anthropic')) return 'claude';
  if (ua.includes('gemini') || ua.includes('google')) return 'gemini';
  return 'unknown';
}

export function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}

export function unauthorizedResponse(message = 'Missing or invalid API key') {
  return NextResponse.json({ error: message }, { status: 401 });
}
