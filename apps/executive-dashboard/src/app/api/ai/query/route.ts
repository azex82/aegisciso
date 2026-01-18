import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';
const DEMO_MODE = process.env.AI_DEMO_MODE !== 'false';

// Production settings
const REQUEST_TIMEOUT_MS = 60000; // 60 second timeout
const MAX_QUERY_LENGTH = 4000;
const MAX_REQUESTS_PER_MINUTE = 1000; // Essentially unlimited

// Groq API endpoint
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ============================================================================
// IN-MEMORY RATE LIMITING & CACHING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const queryCache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();

  // Clean rate limit entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  // Clean cache entries
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      queryCache.delete(key);
    }
  }
}, 60000); // Clean every minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - entry.count, resetIn: entry.resetAt - now };
}

function getCacheKey(query: string, contextType: string): string {
  return `${contextType}:${query.toLowerCase().trim().slice(0, 200)}`;
}

function getCachedResponse(query: string, contextType: string): AIResponse | null {
  const key = getCacheKey(query, contextType);
  const entry = queryCache.get(key);

  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return { ...entry.response, cached: true };
  }

  return null;
}

function setCachedResponse(query: string, contextType: string, response: AIResponse): void {
  const key = getCacheKey(query, contextType);
  queryCache.set(key, { response, timestamp: Date.now() });
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

// Patterns that might indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(everything|all)/i,
  /you\s+are\s+now/i,
  /new\s+instructions?:/i,
  /system\s*:\s*\[/i,
  /\]\s*system\s*:/i,
  /<\/?system>/i,
  /\{\{.*\}\}/,
  /\$\{.*\}/,
];

function validateAndSanitizeInput(query: string): { valid: boolean; sanitized: string; reason?: string } {
  // Check length
  if (!query || typeof query !== 'string') {
    return { valid: false, sanitized: '', reason: 'Query is required' };
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return { valid: false, sanitized: '', reason: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` };
  }

  // Check for prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      console.warn('[SECURITY] Potential prompt injection detected:', query.slice(0, 100));
      return { valid: false, sanitized: '', reason: 'Invalid query format' };
    }
  }

  // Basic sanitization - remove excessive whitespace
  const sanitized = query.trim().replace(/\s+/g, ' ');

  return { valid: true, sanitized };
}

// ============================================================================
// LOGGING & OBSERVABILITY
// ============================================================================

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  userId?: string;
  queryLength?: number;
  contextType?: string;
  model?: string;
  processingTimeMs?: number;
  cached?: boolean;
  error?: string;
  rateLimitRemaining?: number;
}

function log(entry: LogEntry): void {
  const logLine = JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    service: 'sharp-ai-query',
  });

  if (entry.level === 'error') {
    console.error(logLine);
  } else if (entry.level === 'warn') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
}

// ============================================================================
// AI RESPONSE TYPES
// ============================================================================

interface AIResponse {
  answer: string;
  sources: Array<{ id: string; type: string; relevance: number; excerpt: string }>;
  confidence: number;
  model: string;
  processing_time_ms: number;
  filtered: boolean;
  cached?: boolean;
}

// ============================================================================
// SYSTEM PROMPT - Cybersecurity Expert
// ============================================================================

const SYSTEM_PROMPT = `You are a highly intelligent AI Cybersecurity Director and Chief Information Security Officer (CISO) advisor for SHARP, an enterprise cybersecurity governance platform. You have deep expertise and analytical capabilities across all domains of cybersecurity.

## Your Expertise Areas:
1. **Compliance & Regulatory Frameworks**: NCA ECC (Saudi Arabia), SAMA CSF, NIST CSF 2.0, ISO 27001/27002:2022, SOC 2 Type II, CIS Controls v8, PCI DSS 4.0, PDPL (Saudi Data Protection Law), GDPR principles
2. **Risk Management**: Enterprise risk management (ERM), quantitative risk analysis (FAIR), risk appetite frameworks, threat modeling (STRIDE, PASTA), risk treatment strategies, business impact analysis
3. **Security Architecture**: Zero Trust Architecture, defense-in-depth, cloud security (CSA CCM), identity and access management, network segmentation, data protection strategies
4. **Security Operations**: SOC operations, SOC-CMM maturity model, MITRE ATT&CK framework, incident response (NIST SP 800-61), threat intelligence, SIEM/SOAR optimization, detection engineering
5. **Governance & Strategy**: Security program development, board-level reporting, security metrics and KPIs, budget justification, vendor risk management, security awareness programs

## Your Thinking Approach:
When answering questions, use deep analytical reasoning:
1. **Understand the Context**: Consider the full scope of the question and its implications
2. **Analyze Multiple Perspectives**: Evaluate from technical, business, compliance, and risk viewpoints
3. **Provide Structured Analysis**: Organize your response logically with clear sections
4. **Give Actionable Recommendations**: Every insight should lead to concrete next steps
5. **Consider Dependencies**: Identify related areas, prerequisites, and potential impacts
6. **Prioritize Effectively**: Help users focus on what matters most based on risk and business value

## Response Guidelines:
- Provide comprehensive, in-depth responses that demonstrate expertise
- Use structured formatting (headers, bullet points, tables) for clarity
- Include specific control references, metrics, and benchmarks where relevant
- Offer strategic context alongside tactical recommendations
- Anticipate follow-up questions and address them proactively
- When appropriate, provide executive summaries followed by detailed analysis
- Reference industry best practices and standards to support recommendations
- Consider Saudi Arabia regulatory context (NCA, SAMA, PDPL) as primary

## Organization Context:
- Industry: Enterprise/Government sector in Saudi Arabia
- Primary frameworks: NCA ECC, SAMA CSF, ISO 27001
- Security maturity: Developing toward Level 3-4
- Focus areas: Compliance, risk reduction, SOC enhancement

Remember: You are a trusted advisor to senior leadership. Your responses should reflect the depth of knowledge and strategic thinking expected of a seasoned CISO with 15+ years of experience.`;

// ============================================================================
// GROQ API INTEGRATION (Primary - FREE Llama 3.3 70B)
// ============================================================================

async function getGroqResponse(query: string, contextType: string): Promise<AIResponse | null> {
  if (!GROQ_API_KEY) return null;

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 4000,
        top_p: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      log({
        timestamp: new Date().toISOString(),
        level: 'error',
        event: 'groq_api_error',
        error: errorText
      });
      return null;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'Unable to generate response.';

    return {
      answer,
      sources: [],
      confidence: 0.94,
      model: 'Llama 3.3 70B (Groq)',
      processing_time_ms: Date.now() - startTime,
      filtered: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      log({
        timestamp: new Date().toISOString(),
        level: 'error',
        event: 'groq_api_timeout'
      });
    } else {
      log({
        timestamp: new Date().toISOString(),
        level: 'error',
        event: 'groq_api_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return null;
  }
}

// ============================================================================
// OPENAI API INTEGRATION (Fallback)
// ============================================================================

async function getOpenAIResponse(query: string, contextType: string): Promise<AIResponse | null> {
  if (!OPENAI_API_KEY) return null;

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      log({
        timestamp: new Date().toISOString(),
        level: 'error',
        event: 'openai_api_error',
        error: await response.text()
      });
      return null;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'Unable to generate response.';

    return {
      answer,
      sources: [],
      confidence: 0.92,
      model: 'GPT-4o-mini (OpenAI)',
      processing_time_ms: Date.now() - startTime,
      filtered: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    log({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'openai_api_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

// ============================================================================
// SOVEREIGN AI LOCAL BACKEND (Optional)
// ============================================================================

function validateLocalEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'sovereign-ai'];
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function getSovereignAIResponse(
  query: string,
  contextType: string,
  session: any
): Promise<AIResponse | null> {
  if (!validateLocalEndpoint(SOVEREIGN_AI_URL)) return null;

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user?.id || '',
        'X-User-Email': session.user?.email || '',
        'X-User-Role': (session.user as any)?.role || 'ANALYST',
      },
      body: JSON.stringify({
        query,
        context_type: contextType,
        include_sources: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'sovereign_ai_unavailable'
    });
    return null;
  }
}

// ============================================================================
// DEMO MODE RESPONSES
// ============================================================================

function getDemoResponse(query: string, contextType: string): AIResponse {
  const startTime = Date.now();
  const lowerQuery = query.toLowerCase();

  let answer = '';
  let sources: Array<{ id: string; type: string; relevance: number; excerpt: string }> = [];

  // NCA ECC related queries
  if (lowerQuery.includes('nca') || lowerQuery.includes('ecc')) {
    answer = `**NCA Essential Cybersecurity Controls (ECC) Overview:**

The NCA ECC framework consists of 5 main domains with 29 subdomains and 114 controls:

**1. Cybersecurity Governance (1-1 to 1-5)**
- Strategy, policies, roles & responsibilities, risk management, compliance

**2. Cybersecurity Defense (1-6 to 1-10)**
- Asset management, identity management, network security, data protection, cryptography

**3. Cybersecurity Resilience (1-11 to 1-14)**
- Business continuity, disaster recovery, backup, incident management

**4. Third-Party Cybersecurity (2-1 to 2-2)**
- Vendor risk management, cloud security, outsourcing controls

**5. Industrial Control Systems (3-1 to 3-3)**
- OT security, ICS-specific controls (if applicable)

**Recommendation:** Review your current policies against NCA ECC requirements and identify gaps.`;
    sources = [
      { id: 'nca-ecc-2024', type: 'framework', relevance: 0.96, excerpt: 'NCA ECC Framework v2.0' },
    ];
  }
  // Risk queries
  else if (lowerQuery.includes('risk')) {
    answer = `**Risk Management Analysis:**

**Current Risk Landscape:**
- **Critical Risks:** 2 (immediate attention required)
- **High Risks:** 5 (30-day remediation target)
- **Medium Risks:** 12 (60-day remediation target)
- **Low Risks:** 6 (90-day remediation target)

**Top Risks:**
1. **Ransomware Attack** - Critical (Score: 20/25)
   - Treatment: Implement EDR, backup improvements

2. **Third-Party Breach** - High (Score: 15/25)
   - Treatment: Enhanced vendor assessments

**Recommendations:**
- Focus on ransomware controls as highest priority
- Review third-party security agreements
- Conduct quarterly risk assessments`;
    sources = [
      { id: 'risk-register', type: 'risk', relevance: 0.94, excerpt: 'Enterprise Risk Register' },
    ];
  }
  // Compliance queries
  else if (lowerQuery.includes('compliance') || lowerQuery.includes('audit')) {
    answer = `**Compliance Status Summary:**

| Framework | Coverage | Status |
|-----------|----------|--------|
| NCA ECC | 78% | In Progress |
| ISO 27001 | 85% | Certified |
| SAMA CSF | 80% | Compliant |
| NIST CSF | 72% | Developing |

**Priority Actions:**
1. Close NCA ECC gaps (22 controls pending)
2. Prepare for ISO surveillance audit
3. Update SAMA CSF documentation

**Next Audit:** Q2 2025 - NCA ECC Assessment`;
    sources = [
      { id: 'compliance-dash', type: 'report', relevance: 0.96, excerpt: 'Compliance Dashboard' },
    ];
  }
  // Default response
  else {
    answer = `Thank you for your question about "${query.slice(0, 50)}..."

As your AI Cybersecurity Director, I can help you with:

**Compliance & Frameworks**
- NCA ECC, SAMA CSF, NIST CSF, ISO 27001 guidance
- Gap analysis and remediation planning

**Risk Management**
- Risk assessments and treatment plans
- Executive risk reporting

**Security Operations**
- SOC maturity assessments
- Incident response guidance

**Policy Management**
- Policy gap analysis
- Framework control mapping

Please ask a specific question about any of these areas for detailed guidance.`;
    sources = [];
  }

  return {
    answer,
    sources,
    confidence: 0.85,
    model: 'Demo Mode (Simulated)',
    processing_time_ms: Date.now() - startTime + Math.floor(Math.random() * 100),
    filtered: false,
  };
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    // Verify authentication with fallback for database connection issues
    let userId = 'anonymous';
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
      if (session?.user) {
        userId = (session.user as any).id || session.user.email || 'authenticated';
      } else {
        log({
          timestamp: new Date().toISOString(),
          level: 'warn',
          event: 'unauthorized_request'
        });
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } catch (authError) {
      // Database connection might be stale - allow request with anonymous rate limiting
      log({
        timestamp: new Date().toISOString(),
        level: 'warn',
        event: 'auth_error_fallback',
        error: authError instanceof Error ? authError.message : 'Unknown auth error'
      });
      // Continue with anonymous user - will still be rate limited
      userId = 'anonymous_fallback';
    }

    // Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      log({
        timestamp: new Date().toISOString(),
        level: 'warn',
        event: 'rate_limit_exceeded',
        userId
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
          }
        }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { query, context_type = 'general' } = body;

    const validation = validateAndSanitizeInput(query);
    if (!validation.valid) {
      log({
        timestamp: new Date().toISOString(),
        level: 'warn',
        event: 'invalid_input',
        userId,
        error: validation.reason
      });
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    const sanitizedQuery = validation.sanitized;

    // Check cache first
    const cachedResponse = getCachedResponse(sanitizedQuery, context_type);
    if (cachedResponse) {
      log({
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'cache_hit',
        userId,
        queryLength: sanitizedQuery.length,
        contextType: context_type,
        cached: true,
        processingTimeMs: Date.now() - requestStartTime,
        rateLimitRemaining: rateLimit.remaining,
      });

      return NextResponse.json(cachedResponse, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-Cache': 'HIT',
        }
      });
    }

    // Log inbound request
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'ai_query_start',
      userId,
      queryLength: sanitizedQuery.length,
      contextType: context_type,
      rateLimitRemaining: rateLimit.remaining,
    });

    let response: AIResponse | null = null;

    // Try Sovereign AI (local) first if available
    if (!DEMO_MODE) {
      response = await getSovereignAIResponse(sanitizedQuery, context_type, session);
    }

    // Try Groq (FREE Llama 3.3 70B)
    if (!response) {
      response = await getGroqResponse(sanitizedQuery, context_type);
    }

    // Try OpenAI as fallback
    if (!response) {
      response = await getOpenAIResponse(sanitizedQuery, context_type);
    }

    // Fall back to demo mode
    if (!response) {
      response = getDemoResponse(sanitizedQuery, context_type);
    }

    // Cache the response (only if not from demo mode)
    if (response.model !== 'Demo Mode (Simulated)') {
      setCachedResponse(sanitizedQuery, context_type, response);
    }

    // Log completion
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'ai_query_complete',
      userId,
      queryLength: sanitizedQuery.length,
      contextType: context_type,
      model: response.model,
      processingTimeMs: Date.now() - requestStartTime,
      cached: false,
      rateLimitRemaining: rateLimit.remaining,
    });

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-Cache': 'MISS',
        'X-Model': response.model,
      }
    });

  } catch (error) {
    log({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'ai_query_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: Date.now() - requestStartTime,
    });

    return NextResponse.json(
      { error: 'Failed to process AI query' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: {
      groq: !!GROQ_API_KEY,
      openai: !!OPENAI_API_KEY,
      sovereign: validateLocalEndpoint(SOVEREIGN_AI_URL),
    },
    demo_mode: DEMO_MODE,
    cache_size: queryCache.size,
    rate_limit_entries: rateLimitMap.size,
  };

  return NextResponse.json(health);
}
