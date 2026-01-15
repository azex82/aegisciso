import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// CRITICAL: Only allow local sovereign AI endpoint
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';

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

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user has permission for compliance operations
    const userRole = (session.user as any).role;
    const allowedRoles = ['CISO', 'GRC_ANALYST', 'ADMIN', 'SOC_MANAGER'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for policy mapping' },
        { status: 403 }
      );
    }

    // Validate sovereign AI endpoint
    if (!validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      console.error('SOVEREIGNTY VIOLATION: Non-local AI endpoint detected');
      return NextResponse.json(
        { error: 'Sovereignty violation: External AI endpoints blocked' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Forward request to sovereign AI backend
    const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/compliance/policy-mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': (session.user as { id?: string }).id || '',
        'X-User-Email': session.user?.email || '',
        'X-User-Role': userRole,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Policy mapping failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Policy mapping error:', error);
    return NextResponse.json(
      { error: 'Failed to process policy mapping' },
      { status: 500 }
    );
  }
}
