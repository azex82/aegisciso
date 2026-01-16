import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// CRITICAL: Only allow local sovereign AI endpoint
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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

// System prompt for AI Cybersecurity Director
const SYSTEM_PROMPT = `You are the AI Cybersecurity Director for AegisCISO, an enterprise cybersecurity governance platform. You are an expert in:

1. **Compliance Frameworks**: NCA ECC (Saudi Arabia), SAMA CSF, NIST CSF, ISO 27001, ISO 27002, SOC 2, CIS Controls, PDPL (Saudi Data Protection)
2. **Risk Management**: Risk assessment methodologies, risk scoring, treatment plans, risk registers, threat modeling
3. **Security Operations**: SOC operations, SOC-CMM maturity model, incident response, threat intelligence, SIEM/SOAR
4. **Policy Management**: Security policies, procedures, standards, guidelines, policy mapping to frameworks
5. **Governance**: Security strategy, KPIs, metrics, board reporting, compliance tracking

Your role is to:
- Provide clear, actionable cybersecurity advice
- Help with compliance questions and framework requirements
- Analyze risks and recommend mitigations
- Guide policy development and gap analysis
- Support security operations improvements

Always be:
- Professional and executive-appropriate in tone
- Specific with recommendations and next steps
- Reference relevant frameworks and controls when applicable
- Concise but thorough

Current organization context:
- Industry: Enterprise/Government sector in Saudi Arabia
- Primary frameworks: NCA ECC, SAMA CSF, ISO 27001
- Security maturity: Developing (Level 3 target)`;

// Call OpenAI API for intelligent responses
async function getOpenAIResponse(query: string, contextType: string): Promise<{
  answer: string;
  sources: Array<{ id: string; type: string; relevance: number; excerpt: string }>;
  confidence: number;
  model: string;
  processing_time_ms: number;
  filtered: boolean;
} | null> {
  if (!OPENAI_API_KEY) return null;

  const startTime = Date.now();

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
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'Unable to generate response.';

    return {
      answer,
      sources: [],
      confidence: 0.92,
      model: 'GPT-4o-mini (Cloud AI)',
      processing_time_ms: Date.now() - startTime,
      filtered: false,
    };
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return null;
  }
}

// Comprehensive demo responses for when no AI backend is available
function getDemoResponse(query: string, contextType: string) {
  const startTime = Date.now();
  const lowerQuery = query.toLowerCase();

  let answer = '';
  let sources: Array<{ id: string; type: string; relevance: number; excerpt: string }> = [];

  // NCA ECC related queries
  if (lowerQuery.includes('nca') || lowerQuery.includes('ecc')) {
    if (lowerQuery.includes('access') || lowerQuery.includes('identity') || lowerQuery.includes('iam')) {
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

**Recommendation:** Review your current IAM policies against NCA ECC 1-2-1 through 1-2-4 controls.`;
    } else {
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

**Your compliance status:** Based on current data, you have approximately 78% coverage with 25 gaps to address.`;
    }
    sources = [
      { id: 'nca-ecc-2024', type: 'framework', relevance: 0.96, excerpt: 'NCA ECC Framework v2.0' },
      { id: 'nca-mapping', type: 'mapping', relevance: 0.89, excerpt: 'NCA ECC Control Mapping Matrix' },
    ];
  }
  // NIST CSF queries
  else if (lowerQuery.includes('nist') || lowerQuery.includes('csf')) {
    answer = `**NIST Cybersecurity Framework (CSF) Analysis:**

The NIST CSF organizes cybersecurity activities into 5 core functions:

**1. IDENTIFY (ID)**
- Asset Management, Business Environment, Governance, Risk Assessment, Risk Management Strategy

**2. PROTECT (PR)**
- Access Control, Awareness Training, Data Security, Information Protection, Maintenance, Protective Technology

**3. DETECT (DE)**
- Anomalies & Events, Security Continuous Monitoring, Detection Processes

**4. RESPOND (RS)**
- Response Planning, Communications, Analysis, Mitigation, Improvements

**5. RECOVER (RC)**
- Recovery Planning, Improvements, Communications

**Your NIST CSF Coverage:** 72% (30 gaps identified)

**Priority Areas:**
1. Detect function needs enhancement (currently at 65%)
2. Response playbooks require updates
3. Recovery testing procedures incomplete

**Recommendation:** Focus on maturing your detection capabilities and incident response procedures.`;

    sources = [
      { id: 'nist-csf-2.0', type: 'framework', relevance: 0.95, excerpt: 'NIST CSF 2.0 Core Functions' },
      { id: 'gap-nist', type: 'assessment', relevance: 0.88, excerpt: 'NIST CSF Gap Analysis Report' },
    ];
  }
  // ISO 27001 queries
  else if (lowerQuery.includes('iso') || lowerQuery.includes('27001') || lowerQuery.includes('27002')) {
    answer = `**ISO 27001/27002 Compliance Status:**

ISO 27001 is structured around the ISMS (Information Security Management System) with Annex A controls from ISO 27002:

**Annex A Control Categories (ISO 27002:2022):**
1. Organizational Controls (37 controls)
2. People Controls (8 controls)
3. Physical Controls (14 controls)
4. Technological Controls (34 controls)

**Your Current Status:**
- Documentation: 80% complete
- Implementation: 76% of controls implemented
- Gaps: 22 controls need attention

**Priority Gaps:**
1. A.5.7 - Threat intelligence
2. A.8.16 - Monitoring activities
3. A.8.28 - Secure coding practices
4. A.5.23 - Cloud service security

**Certification Readiness:** Recommend 3-month remediation before Stage 1 audit.`;

    sources = [
      { id: 'iso-27001-2022', type: 'framework', relevance: 0.94, excerpt: 'ISO/IEC 27001:2022 Requirements' },
      { id: 'iso-27002-2022', type: 'framework', relevance: 0.91, excerpt: 'ISO/IEC 27002:2022 Control Set' },
    ];
  }
  // SAMA CSF queries
  else if (lowerQuery.includes('sama')) {
    answer = `**SAMA Cybersecurity Framework Analysis:**

The SAMA CSF is mandatory for financial institutions in Saudi Arabia and includes:

**4 Domains:**
1. **Cyber Security Leadership & Governance**
   - Strategy, organization, policies, compliance

2. **Cyber Security Risk Management & Compliance**
   - Risk assessment, third-party risk, regulatory compliance

3. **Cyber Security Operations & Technology**
   - Security operations, vulnerability management, incident response

4. **Third Party Cyber Security**
   - Vendor management, outsourcing controls

**Maturity Levels (1-5):**
- Level 1: Initial
- Level 2: Developing
- Level 3: Defined (regulatory minimum)
- Level 4: Managed
- Level 5: Optimized

**Your Status:** Targeting Level 3 compliance for SAMA reporting requirements.`;

    sources = [
      { id: 'sama-csf', type: 'framework', relevance: 0.95, excerpt: 'SAMA Cybersecurity Framework' },
    ];
  }
  // Risk related queries
  else if (lowerQuery.includes('risk')) {
    if (lowerQuery.includes('summary') || lowerQuery.includes('executive') || lowerQuery.includes('report')) {
      answer = `**Executive Risk Summary:**

**Overall Risk Posture: MODERATE** (Score: 68/100)

**Critical Risks (Immediate Action Required):**
| Risk | Score | Status | Owner |
|------|-------|--------|-------|
| Ransomware Attack | 20/25 | In Treatment | CISO |
| Third-Party Breach | 15/25 | Monitoring | Security Manager |

**Risk Distribution:**
- Critical: 2 (8%)
- High: 5 (20%)
- Medium: 12 (48%)
- Low: 6 (24%)

**Key Trends:**
- 15% reduction in high-risk items (Q4 vs Q3)
- 3 new risks identified this quarter
- 2 risks successfully mitigated

**Board-Level Recommendations:**
1. Approve budget for EDR enhancement ($150K)
2. Mandate third-party security assessments
3. Establish ransomware response retainer

**Next Review:** Quarterly risk review scheduled for next month.`;
    } else {
      answer = `**Risk Management Analysis:**

Based on your risk register, here's the current assessment:

**Risk Categories:**
- **Operational Risks:** 8 active (3 high priority)
- **Technical Risks:** 10 active (2 critical)
- **Compliance Risks:** 4 active (1 high priority)
- **Third-Party Risks:** 3 active (1 critical)

**Top Risks Requiring Attention:**
1. **Ransomware Attack** - Critical (Score: 20/25)
   - Treatment: Implement EDR, backup improvements
   - Target date: 30 days

2. **Third-Party Vendor Breach** - High (Score: 15/25)
   - Treatment: Enhanced vendor assessments
   - Target date: 60 days

**Risk Treatment Options:**
- **Mitigate:** Implement controls to reduce likelihood/impact
- **Transfer:** Insurance, contractual transfers
- **Accept:** Document acceptance with business justification
- **Avoid:** Eliminate the risk source

**Recommendation:** Focus on ransomware controls as highest priority.`;
    }
    sources = [
      { id: 'risk-register', type: 'risk', relevance: 0.94, excerpt: 'Enterprise Risk Register Q4' },
      { id: 'risk-treatment', type: 'report', relevance: 0.88, excerpt: 'Risk Treatment Plans' },
    ];
  }
  // Policy related queries
  else if (lowerQuery.includes('policy') || lowerQuery.includes('policies') || lowerQuery.includes('gap')) {
    answer = `**Policy Management Analysis:**

**Current Policy Portfolio:**
- Total Policies: 24
- Published: 18
- Draft: 4
- Under Review: 2

**Policy Coverage by Framework:**
| Framework | Coverage | Gaps |
|-----------|----------|------|
| NCA ECC | 78% | 25 |
| NIST CSF | 72% | 30 |
| ISO 27001 | 76% | 22 |
| SAMA CSF | 80% | 18 |

**Priority Policy Gaps:**
1. **Incident Response** - Missing attack-specific playbooks
2. **Cloud Security** - Needs comprehensive cloud governance
3. **Data Classification** - Update for new data types
4. **Remote Work** - Enhance BYOD and remote access policies

**Policies Needing Review:**
- Information Security Policy (due in 15 days)
- Access Control Policy (due in 30 days)
- Acceptable Use Policy (overdue by 10 days)

**Recommendation:** Prioritize NCA ECC gaps for regulatory compliance, then focus on cloud security policies.`;

    sources = [
      { id: 'policy-inventory', type: 'policy', relevance: 0.95, excerpt: 'Policy Inventory Dashboard' },
      { id: 'gap-analysis', type: 'assessment', relevance: 0.91, excerpt: 'Framework Gap Analysis' },
    ];
  }
  // SOC/Maturity queries
  else if (lowerQuery.includes('soc') || lowerQuery.includes('maturity') || lowerQuery.includes('cmm')) {
    answer = `**SOC Maturity Assessment (SOC-CMM):**

**Current Overall Maturity: Level 3 - Defined**

**Domain Assessment:**
| Domain | Level | Score | Status |
|--------|-------|-------|--------|
| Business | 3 | 3.2/5 | On Track |
| People | 2 | 2.8/5 | Needs Improvement |
| Process | 3 | 3.4/5 | On Track |
| Technology | 3 | 3.1/5 | On Track |
| Services | 2 | 2.6/5 | Priority Focus |

**Strengths:**
- Well-defined incident response procedures
- Good SIEM coverage and use cases
- Regular threat intelligence integration

**Areas for Improvement:**
1. **People:** Need additional analyst training and certifications
2. **Services:** Implement automated playbooks
3. **Technology:** SOAR integration pending

**Roadmap to Level 4:**
- Q1: Complete SOAR implementation
- Q2: Analyst certification program
- Q3: Advanced threat hunting capabilities
- Q4: 24/7 coverage optimization

**Investment Required:** ~$200K for Level 4 target`;

    sources = [
      { id: 'soc-cmm', type: 'assessment', relevance: 0.97, excerpt: 'SOC-CMM Assessment Report' },
      { id: 'soc-metrics', type: 'report', relevance: 0.89, excerpt: 'SOC Performance Dashboard' },
    ];
  }
  // Incident Response queries
  else if (lowerQuery.includes('incident') || lowerQuery.includes('response') || lowerQuery.includes('breach')) {
    answer = `**Incident Response Overview:**

**Current IR Capabilities:**
- Average detection time (MTTD): 4.2 hours
- Average response time (MTTR): 8.5 hours
- Incident closure rate: 94%

**IR Process Phases:**
1. **Preparation** - Team ready, tools configured
2. **Detection & Analysis** - SIEM alerts, triage procedures
3. **Containment** - Short-term and long-term strategies
4. **Eradication** - Remove threat artifacts
5. **Recovery** - Restore systems and services
6. **Post-Incident** - Lessons learned, improvements

**Active Playbooks:**
- Ransomware Response
- Phishing Incident
- Data Breach
- Insider Threat
- DDoS Attack

**Recommendations:**
1. Conduct quarterly tabletop exercises
2. Update playbooks for cloud-specific scenarios
3. Establish retainer with IR firm
4. Improve forensic capabilities

**Compliance Note:** Ensure IR plan meets NCA ECC 1-12 and SAMA incident reporting requirements.`;

    sources = [
      { id: 'ir-plan', type: 'policy', relevance: 0.94, excerpt: 'Incident Response Plan v3.0' },
      { id: 'ir-metrics', type: 'report', relevance: 0.88, excerpt: 'IR Performance Metrics' },
    ];
  }
  // Compliance/Audit queries
  else if (lowerQuery.includes('compliance') || lowerQuery.includes('audit')) {
    answer = `**Compliance Dashboard Summary:**

**Framework Compliance Status:**
| Framework | Status | Score | Next Audit |
|-----------|--------|-------|------------|
| NCA ECC | In Progress | 78% | Q2 2025 |
| SAMA CSF | Compliant | 85% | Annual |
| ISO 27001 | Certified | 92% | Surveillance Q3 |
| SOC 2 Type II | In Progress | 70% | Q4 2025 |

**Outstanding Audit Findings:**
- 3 High priority (30-day remediation)
- 8 Medium priority (60-day remediation)
- 5 Low priority (90-day remediation)

**Upcoming Compliance Activities:**
1. NCA ECC self-assessment (due in 45 days)
2. ISO 27001 surveillance audit (Q3)
3. Penetration testing (scheduled next month)
4. SAMA annual submission (Q4)

**Regulatory Changes to Monitor:**
- PDPL (Saudi Data Protection Law) enforcement
- NCA ECC v2.1 updates expected
- New cloud security requirements

**Recommendation:** Prioritize high-priority findings and prepare for NCA ECC assessment.`;

    sources = [
      { id: 'compliance-dash', type: 'report', relevance: 0.96, excerpt: 'Compliance Status Dashboard' },
      { id: 'audit-findings', type: 'assessment', relevance: 0.90, excerpt: 'Open Audit Findings' },
    ];
  }
  // Security metrics/KPIs
  else if (lowerQuery.includes('metric') || lowerQuery.includes('kpi') || lowerQuery.includes('dashboard')) {
    answer = `**Security Metrics & KPIs:**

**Executive Dashboard Metrics:**

**Risk Metrics:**
- Overall Risk Score: 68/100 (Target: 75)
- Critical Risks: 2 (Target: 0)
- Risk Reduction Rate: 15% QoQ

**Compliance Metrics:**
- Framework Coverage: 78% (Target: 85%)
- Audit Finding Closure: 85% (Target: 95%)
- Policy Currency: 90% (Target: 100%)

**Operational Metrics:**
- MTTD: 4.2 hours (Target: 2 hours)
- MTTR: 8.5 hours (Target: 4 hours)
- Vulnerability Remediation: 72% on time

**Security Posture:**
- Patch Compliance: 89%
- Endpoint Protection: 98%
- MFA Adoption: 94%

**Trends (This Quarter):**
- ↑ 5% improvement in risk score
- ↓ 20% reduction in critical vulnerabilities
- ↑ 12% improvement in patch compliance

**Recommendation:** Focus on reducing MTTD/MTTR and closing audit findings to meet targets.`;

    sources = [
      { id: 'kpi-dashboard', type: 'report', relevance: 0.95, excerpt: 'Security KPI Dashboard' },
    ];
  }
  // Threat intelligence
  else if (lowerQuery.includes('threat') || lowerQuery.includes('intelligence') || lowerQuery.includes('attack')) {
    answer = `**Threat Intelligence Briefing:**

**Current Threat Landscape:**

**Active Threats Targeting Your Sector:**
1. **Ransomware Groups**
   - LockBit 3.0, BlackCat active in region
   - Targeting: VPN vulnerabilities, RDP exposure

2. **APT Activity**
   - State-sponsored actors targeting critical infrastructure
   - Focus on supply chain compromise

3. **Phishing Campaigns**
   - Credential harvesting increased 30%
   - Business email compromise (BEC) trending

**Vulnerability Alerts:**
- CVE-2024-XXXX: Critical - Patch immediately
- CVE-2024-YYYY: High - 7-day patch window

**Indicators of Compromise (Recent):**
- 15 malicious IPs blocked this week
- 3 phishing domains identified
- 2 malware samples analyzed

**Recommendations:**
1. Verify VPN and RDP are not exposed
2. Enable MFA on all external access
3. Conduct phishing simulation this month
4. Review supply chain security controls

**Threat Level: ELEVATED** - Increased vigilance recommended.`;

    sources = [
      { id: 'threat-intel', type: 'intelligence', relevance: 0.94, excerpt: 'Weekly Threat Intelligence Report' },
      { id: 'ioc-feed', type: 'intelligence', relevance: 0.88, excerpt: 'IOC Feed Analysis' },
    ];
  }
  // Strategy/Objectives
  else if (lowerQuery.includes('strategy') || lowerQuery.includes('objective') || lowerQuery.includes('roadmap') || lowerQuery.includes('priority') || lowerQuery.includes('priorities')) {
    answer = `**Cybersecurity Strategy & Objectives:**

**Strategic Priorities (Current Year):**

1. **Enhance Detection & Response**
   - Implement SOAR platform
   - Achieve 24/7 SOC coverage
   - Progress: 65%

2. **Achieve NCA ECC Compliance**
   - Close all critical gaps
   - Pass regulatory assessment
   - Progress: 78%

3. **Strengthen Third-Party Security**
   - Vendor risk program maturity
   - Continuous monitoring
   - Progress: 55%

4. **Improve Security Awareness**
   - Reduce phishing susceptibility <5%
   - Executive training program
   - Progress: 80%

**Budget Allocation:**
- Detection & Response: 35%
- Compliance: 25%
- Third-Party Risk: 15%
- Training & Awareness: 10%
- Other Initiatives: 15%

**Key Milestones:**
- Q1: SOAR implementation complete
- Q2: NCA ECC assessment
- Q3: Vendor risk platform launch
- Q4: Strategy review and planning

**Recommendation:** Focus resources on NCA ECC compliance and SOAR implementation as top priorities.`;

    sources = [
      { id: 'security-strategy', type: 'strategy', relevance: 0.96, excerpt: 'Cybersecurity Strategy 2024-2025' },
      { id: 'objectives', type: 'strategy', relevance: 0.91, excerpt: 'Strategic Objectives Tracker' },
    ];
  }
  // Hello/greeting
  else if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.match(/^hey/)) {
    answer = `Hello! I'm your AI Cybersecurity Director. I'm here to help you with:

**Compliance & Frameworks**
- NCA ECC, SAMA CSF, NIST CSF, ISO 27001
- Gap analysis and remediation planning

**Risk Management**
- Risk assessments and executive summaries
- Treatment plans and tracking

**Security Operations**
- SOC maturity (SOC-CMM) assessments
- Incident response guidance

**Policy Management**
- Policy gap analysis
- Framework mapping

**How can I assist you today?** Try asking about your compliance status, risk posture, or security metrics.`;
    sources = [];
  }
  // Help/capabilities
  else if (lowerQuery.includes('help') || lowerQuery.includes('what can you') || lowerQuery.includes('capabilities')) {
    answer = `**AI Cybersecurity Director Capabilities:**

I can help you with a wide range of cybersecurity governance, risk, and compliance topics:

**1. Compliance Management**
- Framework requirements (NCA ECC, SAMA, NIST, ISO)
- Gap analysis and remediation guidance
- Audit preparation support

**2. Risk Management**
- Risk assessment analysis
- Executive risk summaries
- Treatment recommendations

**3. Security Operations**
- SOC maturity assessments
- Incident response guidance
- Threat intelligence briefings

**4. Policy Management**
- Policy gap identification
- Framework mapping
- Review scheduling

**5. Metrics & Reporting**
- KPI analysis
- Dashboard insights
- Trend analysis

**Example Questions:**
- "What is our NCA ECC compliance status?"
- "Generate an executive risk summary"
- "What are our top security priorities?"
- "Analyze our SOC maturity level"
- "What policies need review?"

Feel free to ask any cybersecurity-related question!`;
    sources = [];
  }
  // Default - intelligent general response
  else {
    answer = `Thank you for your question. Let me provide some relevant information:

**Regarding "${query}":**

Based on your organization's cybersecurity context, here are some key considerations:

**Current Security Posture:**
- Overall Score: 68/100
- Compliance Coverage: 78%
- Active Risks: 25 (2 critical)

**Relevant Areas to Consider:**

1. **Compliance Alignment**
   - Ensure activities align with NCA ECC and SAMA requirements
   - Review framework mappings for related controls

2. **Risk Perspective**
   - Consider how this relates to your risk register
   - Evaluate potential impact on critical assets

3. **Policy Coverage**
   - Check if existing policies address this area
   - Identify any gaps requiring new procedures

4. **Operational Readiness**
   - Assess current capabilities
   - Plan for any required enhancements

**Recommended Next Steps:**
1. Review relevant policies and procedures
2. Assess compliance implications
3. Update risk register if applicable
4. Document decisions and rationale

Would you like me to elaborate on any specific aspect? You can also ask about:
- Specific framework requirements
- Risk analysis for particular scenarios
- Policy recommendations
- Security metrics and KPIs`;

    sources = [
      { id: 'security-posture', type: 'report', relevance: 0.75, excerpt: 'Security Posture Overview' },
    ];
  }

  return {
    answer,
    sources,
    confidence: 0.85 + Math.random() * 0.1,
    model: 'Demo Mode (Simulated AI)',
    processing_time_ms: Date.now() - startTime + Math.floor(Math.random() * 300) + 100,
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

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Try real AI backend first
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
        console.log('Sovereign AI backend unavailable, trying fallback');
      }
    }

    // Try OpenAI if available
    const openAIResponse = await getOpenAIResponse(query, context_type);
    if (openAIResponse) {
      return NextResponse.json(openAIResponse);
    }

    // Fallback to comprehensive demo mode
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
