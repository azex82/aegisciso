import { NextResponse } from 'next/server';

/**
 * Proxy for Ollama API
 * This allows the frontend to check Ollama status through the backend
 * since Ollama runs on localhost of the server, not the client
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Ollama not responding', models: [] },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ollama is not running', models: [] },
      { status: 503 }
    );
  }
}
