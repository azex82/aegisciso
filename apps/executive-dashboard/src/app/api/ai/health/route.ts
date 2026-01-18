import { NextResponse } from 'next/server';

// ============================================================================
// AI HEALTH CHECK ENDPOINT
// Returns status of all AI providers and system health
// ============================================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';
const DEMO_MODE = process.env.AI_DEMO_MODE !== 'false';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  mode: 'production' | 'demo';
  providers: {
    groq: {
      configured: boolean;
      status: 'available' | 'unavailable' | 'unchecked';
    };
    openai: {
      configured: boolean;
      status: 'available' | 'unavailable' | 'unchecked';
    };
    sovereign: {
      configured: boolean;
      status: 'available' | 'unavailable' | 'unchecked';
      endpoint?: string;
    };
  };
  llm_available: boolean;
  rag_available: boolean;
  features: {
    streaming: boolean;
    caching: boolean;
    rateLimiting: boolean;
    inputValidation: boolean;
  };
}

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

async function checkGroqHealth(): Promise<'available' | 'unavailable'> {
  if (!GROQ_API_KEY) return 'unavailable';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    return response.ok ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function checkSovereignHealth(): Promise<'available' | 'unavailable'> {
  try {
    if (!validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      return 'unavailable';
    }

    const response = await fetch(`${SOVEREIGN_AI_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function GET() {
  const startTime = Date.now();

  // Check providers in parallel
  const [groqStatus, sovereignStatus] = await Promise.all([
    checkGroqHealth(),
    checkSovereignHealth(),
  ]);

  // Determine overall status
  const llmAvailable = groqStatus === 'available' || sovereignStatus === 'available';
  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = llmAvailable
    ? 'healthy'
    : DEMO_MODE
      ? 'degraded'
      : 'unhealthy';

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: DEMO_MODE ? 'demo' : 'production',
    providers: {
      groq: {
        configured: !!GROQ_API_KEY,
        status: groqStatus,
      },
      openai: {
        configured: !!OPENAI_API_KEY,
        status: 'unchecked', // Don't check OpenAI to avoid unnecessary API calls
      },
      sovereign: {
        configured: validateLocalEndpoint(SOVEREIGN_AI_URL),
        status: sovereignStatus,
        endpoint: SOVEREIGN_AI_URL,
      },
    },
    llm_available: llmAvailable,
    rag_available: sovereignStatus === 'available',
    features: {
      streaming: !!GROQ_API_KEY,
      caching: true,
      rateLimiting: true,
      inputValidation: true,
    },
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      ...health,
      response_time_ms: responseTime,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  );
}
