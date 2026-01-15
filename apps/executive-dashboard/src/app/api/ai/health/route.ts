import { NextResponse } from 'next/server';

// CRITICAL: Only allow local sovereign AI endpoint
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';
const DEMO_MODE = process.env.AI_DEMO_MODE !== 'false'; // Default to demo mode

// Validate the endpoint is local
function validateLocalEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'sovereign-ai'];
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET() {
  // Demo mode - always return online status
  if (DEMO_MODE) {
    return NextResponse.json({
      status: 'online',
      version: '1.0.0-demo',
      llm_available: true,
      rag_available: true,
      sovereignty_validated: true,
      mode: 'demo',
      model: 'LLaMA 3 70B (simulated)',
    });
  }

  try {
    // Validate sovereign AI endpoint
    if (!validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      return NextResponse.json({
        status: 'error',
        error: 'Sovereignty violation: Non-local endpoint',
        llm_available: false,
        rag_available: false,
      }, { status: 403 });
    }

    const response = await fetch(`${SOVEREIGN_AI_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        status: 'offline',
        error: 'AI service unavailable',
        llm_available: false,
        rag_available: false,
      }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({
      status: 'offline',
      error: 'Failed to connect to AI service',
      llm_available: false,
      rag_available: false,
    }, { status: 503 });
  }
}
