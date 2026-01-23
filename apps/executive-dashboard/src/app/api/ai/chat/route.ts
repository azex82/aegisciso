import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Multi-Provider AI Chat API
 *
 * Supports: OpenAI, xAI (Grok), DeepSeek, Ollama
 *
 * Environment variables:
 * - OPENAI_API_KEY: OpenAI API key
 * - XAI_API_KEY: xAI (Grok) API key
 * - DEEPSEEK_API_KEY: DeepSeek API key
 * - OLLAMA_BASE_URL: Ollama base URL (default: http://localhost:11434)
 */

// Provider configurations
const PROVIDER_CONFIGS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyEnv: 'GROQ_API_KEY',
    name: 'Groq',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKeyEnv: 'OPENAI_API_KEY',
    name: 'OpenAI',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    name: 'DeepSeek',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    apiKeyEnv: null,
    name: 'Ollama (Local)',
  },
} as const;

type Provider = keyof typeof PROVIDER_CONFIGS;

// Fallback model configuration
const FALLBACK_PROVIDER = 'groq';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

// System prompt for AI Security Advisor
const SYSTEM_PROMPT = `You are an AI Cybersecurity Director and Chief Information Security Officer (CISO) advisor. You have deep expertise across all domains of cybersecurity.

## Your Expertise Areas:
1. **Compliance & Regulatory Frameworks**: NCA ECC, NIST CSF 2.0, ISO 27001/27002:2022, SOC 2 Type II, CIS Controls v8, PCI DSS 4.0, GDPR
2. **Risk Management**: Enterprise risk management (ERM), quantitative risk analysis (FAIR), threat modeling (STRIDE, PASTA), risk treatment strategies
3. **Security Architecture**: Zero Trust Architecture, defense-in-depth, cloud security (CSA CCM), identity and access management
4. **Security Operations**: SOC operations, MITRE ATT&CK framework, incident response, threat intelligence, SIEM/SOAR
5. **Governance & Strategy**: Security program development, board-level reporting, security metrics and KPIs

## Response Guidelines:
- Provide comprehensive, well-structured responses with actionable recommendations
- Use markdown formatting for clarity (headers, bullet points, tables)
- Include specific control references and industry best practices
- Consider the security context and provide risk-based prioritization
- Be concise but thorough

You are a trusted advisor to senior leadership. Your responses should reflect deep expertise and strategic thinking.`;

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  entry.count++;
  return true;
}

// Input validation
function validateInput(body: any): { valid: boolean; error?: string } {
  if (!body.provider || !body.model || !body.message) {
    return { valid: false, error: 'Missing required fields: provider, model, message' };
  }

  if (typeof body.message !== 'string' || body.message.length > 10000) {
    return { valid: false, error: 'Message must be a string with max 10000 characters' };
  }

  if (!Object.keys(PROVIDER_CONFIGS).includes(body.provider)) {
    return { valid: false, error: `Invalid provider: ${body.provider}` };
  }

  return { valid: true };
}

// Check if Ollama is running
async function checkOllamaHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Call OpenAI-compatible API (OpenAI, xAI, DeepSeek)
async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 4096
): Promise<{ content: string; usage?: any }> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60000), // 60 second timeout
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API error: ${response.status}`;

    // Check for specific error types
    if (errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
      throw new Error(`Insufficient credits. Please add credits to your account.`);
    }
    if (errorMessage.includes('rate limit')) {
      throw new Error('API rate limit reached. Please try again in a few moments.');
    }
    if (errorMessage.includes('model') || response.status === 404) {
      throw new Error(`Model "${model}" not found or not available.`);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
  };
}

// Call Ollama API
async function callOllama(
  baseUrl: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string }> {
  // Check if Ollama is running
  const isHealthy = await checkOllamaHealth(baseUrl);
  if (!isHealthy) {
    throw new Error('Ollama is not running or not reachable. Please start Ollama with: ollama serve');
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
    signal: AbortSignal.timeout(120000), // 2 minute timeout for local models
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (errorText.includes('model') && errorText.includes('not found')) {
      throw new Error(`Model "${model}" not found. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content || '',
  };
}

// Try to call with fallback
async function callWithFallback(
  provider: Provider,
  model: string,
  messages: Array<{ role: string; content: string }>,
  enableFallback: boolean = true
): Promise<{ content: string; usage?: any; provider: string; model: string; usedFallback?: boolean }> {
  const providerConfig = PROVIDER_CONFIGS[provider];

  try {
    let result: { content: string; usage?: any };

    if (provider === 'ollama') {
      result = await callOllama(providerConfig.baseUrl, model, messages);
    } else {
      const apiKey = process.env[providerConfig.apiKeyEnv as string];
      if (!apiKey) {
        throw new Error(`${providerConfig.name} API key not configured. Please add ${providerConfig.apiKeyEnv} to your environment variables.`);
      }
      result = await callOpenAICompatible(providerConfig.baseUrl, apiKey, model, messages);
    }

    return { ...result, provider, model };
  } catch (error) {
    // If fallback is enabled and we're not already on the fallback provider
    if (enableFallback && provider !== FALLBACK_PROVIDER) {
      const fallbackConfig = PROVIDER_CONFIGS[FALLBACK_PROVIDER];
      const fallbackApiKey = process.env[fallbackConfig.apiKeyEnv as string];

      if (fallbackApiKey) {
        console.log(`Primary provider ${provider} failed, falling back to ${FALLBACK_PROVIDER}/${FALLBACK_MODEL}`);
        try {
          const fallbackResult = await callOpenAICompatible(
            fallbackConfig.baseUrl,
            fallbackApiKey,
            FALLBACK_MODEL,
            messages
          );
          return {
            ...fallbackResult,
            provider: FALLBACK_PROVIDER,
            model: FALLBACK_MODEL,
            usedFallback: true,
          };
        } catch (fallbackError) {
          // Fallback also failed, throw original error
          throw error;
        }
      }
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use the AI assistant.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || session.user.email || 'anonymous';

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before sending more messages.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { provider, model, message, history = [], conversation_id } = body;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: message },
    ];

    // Call provider with fallback support
    const result = await callWithFallback(provider as Provider, model, messages);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      processing_time_ms: processingTime,
      usage: result.usage,
      used_fallback: result.usedFallback,
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    // Return appropriate status codes based on error type
    if (errorMessage.includes('API key not configured') || errorMessage.includes('not configured')) {
      return NextResponse.json({ error: errorMessage }, { status: 503 });
    }

    if (errorMessage.includes('Ollama is not running') || errorMessage.includes('not reachable')) {
      return NextResponse.json({ error: errorMessage }, { status: 503 });
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { error: 'API rate limit reached. Please try again in a few moments.' },
        { status: 429 }
      );
    }

    if (errorMessage.includes('Insufficient credits')) {
      return NextResponse.json({ error: errorMessage }, { status: 402 });
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const providers: Record<string, { available: boolean; error?: string }> = {};

  // Check each provider
  for (const [key, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (key === 'ollama') {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const isHealthy = await checkOllamaHealth(baseUrl);
      providers[key] = {
        available: isHealthy,
        error: isHealthy ? undefined : 'Ollama is not running or not reachable',
      };
    } else {
      const apiKey = process.env[config.apiKeyEnv as string];
      providers[key] = {
        available: !!apiKey,
        error: apiKey ? undefined : `API key not configured (${config.apiKeyEnv})`,
      };
    }
  }

  return NextResponse.json({
    status: 'ok',
    providers,
    timestamp: new Date().toISOString(),
  });
}
