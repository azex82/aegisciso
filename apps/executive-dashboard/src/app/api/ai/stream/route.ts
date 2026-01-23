import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================================================
// STREAMING AI ENDPOINT
// Provides real-time token streaming for better UX
// ============================================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limiting (shared with main query endpoint)
const MAX_REQUESTS_PER_MINUTE = 20;
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

// System prompt
const SYSTEM_PROMPT = `You are a highly intelligent AI Cybersecurity Director and CISO advisor for SHARP. You have deep expertise across all cybersecurity domains including:
- Compliance: NCA ECC, NIST CSF, ISO 27001, SOC 2
- Risk Management: FAIR, threat modeling, risk treatment
- Security Operations: SOC-CMM, incident response, MITRE ATT&CK
- Governance: Security strategy, metrics, vendor risk

Provide comprehensive, well-structured responses with actionable recommendations. Use markdown formatting for clarity.`;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = (session.user as any).id || session.user.email || 'anonymous';

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { query, context_type = 'general' } = await request.json();

    if (!query || typeof query !== 'string' || query.length > 4000) {
      return new Response(JSON.stringify({ error: 'Invalid query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create streaming response from Groq
    const groqResponse = await fetch(GROQ_API_URL, {
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
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq streaming error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a TransformStream to process SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Forward the content as SSE
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      },
    });

    // Pipe Groq response through transform stream
    const reader = groqResponse.body?.getReader();
    const writer = transformStream.writable.getWriter();

    if (reader) {
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              await writer.close();
              break;
            }
            await writer.write(value);
          }
        } catch (e) {
          console.error('Stream error:', e);
          await writer.abort(e);
        }
      })();
    }

    return new Response(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Model': 'Llama 3.3 70B (Groq)',
      },
    });

  } catch (error) {
    console.error('Streaming endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
