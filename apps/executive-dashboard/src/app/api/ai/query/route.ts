import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// Demo responses for POC
function getDemoResponse(query: string, contextType: string) {
  const startTime = Date.now();
  const lowerQuery = query.toLowerCase();

  let answer = '';
  let sources: Array<{ id: string; type: string; relevance: number; excerpt: string }> = [];

  // NCA ECC related queries
  if (lowerQuery.includes('nca') || lowerQuery.includes('ecc') || lowerQuery.includes('access management')) {
    answer = `Based on NCA Essential Cybersecurity Controls (ECC), access management requirements include:

**1. Identity Management (1-2-1)**
- Implement formal user registration and de-registration procedures
- Use unique user IDs for accountability
- Regularly review and update access rights

**2. Access Control (1-2-2)**
- Implement role-based access control (RBAC)
- Apply principle of least privilege
- Segregate sensitive duties

**3. Privileged Access (1-2-3)**
- Restrict and monitor privileged accounts
- Implement privileged access workstations (PAW)
- Use multi-factor authentication for privileged users

**Recommendation:** Review your current IAM policies against NCA ECC 1-2-1 through 1-2-4 controls and implement any gaps.`;

    sources = [
      { id: 'nca-1-2-1', type: 'framework', relevance: 0.95, excerpt: 'NCA ECC 1-2-1: Identity Management Control' },
      { id: 'nca-1-2-2', type: 'framework', relevance: 0.92, excerpt: 'NCA ECC 1-2-2: Access Control Policy' },
      { id: 'pol-iam-001', type: 'policy', relevance: 0.88, excerpt: 'Information Security Policy - Access Management Section' },
    ];
  }
  // Risk related queries
  else if (lowerQuery.includes('risk') || lowerQuery.includes('threat')) {
    answer = `Based on your current risk register analysis:

**Critical Risks Requiring Immediate Attention:**
1. **Ransomware Attack** (Score: 20/25) - Active treatment in progress
2. **Third-Party Vendor Breach** (Score: 15/25) - Monitoring controls needed

**Risk Mitigation Recommendations:**
- Enhance endpoint detection and response (EDR) capabilities
- Implement network segmentation for critical assets
- Conduct tabletop exercises for incident response
- Review and update third-party risk assessments

**Compliance Impact:** Current risk posture may affect NCA ECC compliance in domains 1-3 (Cybersecurity Defense) and 2-1 (Third Party Management).`;

    sources = [
      { id: 'risk-001', type: 'risk', relevance: 0.94, excerpt: 'Ransomware Attack - Critical Infrastructure Risk Assessment' },
      { id: 'risk-002', type: 'risk', relevance: 0.89, excerpt: 'Third-Party Vendor Data Breach Risk Analysis' },
      { id: 'nca-1-3', type: 'framework', relevance: 0.85, excerpt: 'NCA ECC 1-3: Cybersecurity Defense Controls' },
    ];
  }
  // Policy related queries
  else if (lowerQuery.includes('policy') || lowerQuery.includes('gap')) {
    answer = `**Policy Gap Analysis Summary:**

Your current policy coverage against major frameworks:
- **NCA ECC:** 78% coverage (25 gaps identified)
- **NIST CSF:** 72% coverage (30 gaps identified)
- **ISO 27001:** 76% coverage (22 gaps identified)

**Priority Gaps to Address:**
1. Incident Response - Missing playbooks for specific attack scenarios
2. Cloud Security - Incomplete cloud governance policies
3. Data Classification - Needs update for new data types
4. Third-Party Risk - Vendor assessment procedures incomplete

**Recommendation:** Focus on addressing NCA ECC gaps first given regulatory requirements.`;

    sources = [
      { id: 'gap-analysis', type: 'assessment', relevance: 0.96, excerpt: 'Quarterly Policy Gap Analysis Report' },
      { id: 'pol-ir-001', type: 'policy', relevance: 0.88, excerpt: 'Incident Response Policy v2.1' },
      { id: 'nca-mapping', type: 'mapping', relevance: 0.85, excerpt: 'NCA ECC to Policy Mapping Matrix' },
    ];
  }
  // SOC/Maturity queries
  else if (lowerQuery.includes('soc') || lowerQuery.includes('maturity')) {
    answer = `**SOC Maturity Assessment (SOC-CMM Based):**

**Current Overall Maturity: Level 3 - Defined**

**Domain Scores:**
- Business: Level 3 (3.2/5)
- People: Level 2 (2.8/5) - Needs improvement
- Process: Level 3 (3.4/5)
- Technology: Level 3 (3.1/5)
- Services: Level 2 (2.6/5) - Priority focus area

**Key Recommendations:**
1. Enhance SOC analyst training program (People domain)
2. Implement automated playbooks for common incidents (Services)
3. Improve metrics and KPI tracking (Process)
4. Upgrade to SOAR platform integration (Technology)

**Target:** Achieve Level 4 maturity within 12 months.`;

    sources = [
      { id: 'soc-cmm', type: 'assessment', relevance: 0.97, excerpt: 'SOC-CMM Assessment Q4 2024' },
      { id: 'soc-metrics', type: 'report', relevance: 0.91, excerpt: 'SOC Performance Metrics Dashboard' },
    ];
  }
  // Default response
  else {
    answer = `I can help you with cybersecurity governance, risk, and compliance questions. Here are some topics I can assist with:

**Compliance & Frameworks:**
- NCA ECC, SAMA CSF, NIST CSF, ISO 27001 requirements
- Policy mapping to compliance frameworks
- Gap analysis and remediation planning

**Risk Management:**
- Risk assessment and scoring
- Treatment plans and tracking
- Threat intelligence integration

**Security Operations:**
- SOC maturity assessment (SOC-CMM)
- Incident response procedures
- Security metrics and KPIs

**Try asking:**
- "What controls does NCA ECC require for access management?"
- "Analyze our policy gaps against NIST CSF"
- "What is our current SOC maturity level?"
- "Generate an executive risk summary"`;

    sources = [];
  }

  return {
    answer,
    sources,
    confidence: 0.85 + Math.random() * 0.1,
    model: 'demo-mode (LLaMA 3 simulation)',
    processing_time_ms: Date.now() - startTime + Math.floor(Math.random() * 500) + 200,
    filtered: false,
  };
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

    const body = await request.json();
    const { query, context_type = 'general' } = body;

    // Try real AI backend first, fallback to demo mode
    if (!DEMO_MODE && validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      try {
        const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/ai/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': (session.user as { id?: string }).id || '',
            'X-User-Email': session.user?.email || '',
            'X-User-Role': (session.user as any).role || 'ANALYST',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.log('AI backend unavailable, using demo mode');
      }
    }

    // Demo mode response
    const demoResponse = getDemoResponse(query, context_type);
    return NextResponse.json(demoResponse);

  } catch (error) {
    console.error('AI query error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI query' },
      { status: 500 }
    );
  }
}
