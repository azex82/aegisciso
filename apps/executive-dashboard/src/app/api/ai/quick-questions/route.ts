import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@aegisciso/db';
import type { SessionUser } from '@aegisciso/shared';

interface QuickQuestion {
  label: string;
  query: string;
  category: 'risk' | 'policy' | 'compliance' | 'strategy' | 'general';
  priority: number;
}

// Base questions pool that can be customized
const baseQuestions: QuickQuestion[] = [
  { label: "Executive Risk Summary", query: "Generate an executive risk summary for the board", category: 'risk', priority: 1 },
  { label: "Policy Gaps", query: "What are our top policy gaps against NCA ECC?", category: 'policy', priority: 2 },
  { label: "NCA ECC Compliance", query: "What controls does NCA ECC require for access management?", category: 'compliance', priority: 2 },
  { label: "SOC Maturity", query: "What is our current SOC maturity level?", category: 'strategy', priority: 3 },
  { label: "Top Priorities", query: "What should be our top 3 security priorities this quarter?", category: 'strategy', priority: 1 },
  { label: "Compliance Status", query: "Summarize our compliance status across all frameworks", category: 'compliance', priority: 2 },
  { label: "Risk Trends", query: "How have our risk levels changed over the past quarter?", category: 'risk', priority: 3 },
  { label: "Policy Review", query: "Which policies are due for review soon?", category: 'policy', priority: 2 },
  { label: "Control Effectiveness", query: "Assess the effectiveness of our current security controls", category: 'compliance', priority: 3 },
  { label: "Incident Readiness", query: "How prepared are we for a security incident?", category: 'risk', priority: 2 },
];

// Role-specific questions
const roleSpecificQuestions: Record<string, QuickQuestion[]> = {
  CISO: [
    { label: "Board Report", query: "Generate a security posture report for the board of directors", category: 'general', priority: 1 },
    { label: "Budget Justification", query: "Help me justify the security budget with risk data", category: 'strategy', priority: 1 },
    { label: "Strategic Roadmap", query: "What should our 3-year security roadmap look like?", category: 'strategy', priority: 2 },
  ],
  SECURITY_MANAGER: [
    { label: "Team Priorities", query: "What should my team focus on this week?", category: 'general', priority: 1 },
    { label: "Vendor Assessment", query: "How should we assess third-party vendor security?", category: 'risk', priority: 2 },
    { label: "Training Needs", query: "What security training does our organization need?", category: 'general', priority: 3 },
  ],
  ANALYST: [
    { label: "Risk Analysis", query: "Help me analyze the impact of recent security incidents", category: 'risk', priority: 1 },
    { label: "Control Mapping", query: "Map our policies to NCA ECC controls", category: 'compliance', priority: 2 },
    { label: "Gap Analysis", query: "Perform a gap analysis against ISO 27001", category: 'compliance', priority: 2 },
  ],
  ADMIN: [
    { label: "System Overview", query: "Give me an overview of the security management system", category: 'general', priority: 1 },
    { label: "User Activity", query: "Summarize recent user activity and access patterns", category: 'general', priority: 2 },
  ],
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userRole = user.role || 'ANALYST';

    // Fetch current state from database
    const [risks, policies, frameworks, latestSnapshot] = await Promise.all([
      prisma.risk.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          inherentRiskScore: true,
          treatmentStatus: true,
          targetDate: true,
        },
        orderBy: { inherentRiskScore: 'desc' },
        take: 20,
      }),
      prisma.policy.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          reviewDate: true,
          expiryDate: true,
        },
        take: 20,
      }),
      prisma.framework.findMany({
        where: { isActive: true },
        include: {
          controls: {
            include: {
              mappings: true,
            },
          },
        },
      }),
      prisma.postureSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
      }),
    ]);

    // Generate context-aware questions based on current data
    const contextQuestions: QuickQuestion[] = [];

    // Risk-based questions
    const criticalRisks = risks.filter(r => r.inherentRiskScore >= 20);
    const overdueRisks = risks.filter(r => r.targetDate && new Date(r.targetDate) < new Date());
    const untreatedRisks = risks.filter(r => r.treatmentStatus === 'NOT_STARTED');

    if (criticalRisks.length > 0) {
      contextQuestions.push({
        label: `${criticalRisks.length} Critical Risks`,
        query: `We have ${criticalRisks.length} critical risks. What immediate actions should we take to address them?`,
        category: 'risk',
        priority: 1,
      });
    }

    if (overdueRisks.length > 0) {
      contextQuestions.push({
        label: `${overdueRisks.length} Overdue Risks`,
        query: `There are ${overdueRisks.length} risks past their due date. Help me create an escalation plan.`,
        category: 'risk',
        priority: 1,
      });
    }

    if (untreatedRisks.length > 3) {
      contextQuestions.push({
        label: "Untreated Risks",
        query: `${untreatedRisks.length} risks have no treatment plan. How should we prioritize these?`,
        category: 'risk',
        priority: 2,
      });
    }

    // Policy-based questions
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const policiesNeedingReview = policies.filter(p =>
      p.reviewDate && new Date(p.reviewDate) <= thirtyDaysFromNow
    );
    const draftPolicies = policies.filter(p => p.status === 'DRAFT');

    if (policiesNeedingReview.length > 0) {
      contextQuestions.push({
        label: `${policiesNeedingReview.length} Policies Due`,
        query: `${policiesNeedingReview.length} policies need review soon. What should I prioritize?`,
        category: 'policy',
        priority: 2,
      });
    }

    if (draftPolicies.length > 0) {
      contextQuestions.push({
        label: `${draftPolicies.length} Draft Policies`,
        query: `Help me finalize our ${draftPolicies.length} draft policies for publication`,
        category: 'policy',
        priority: 3,
      });
    }

    // Compliance-based questions
    for (const framework of frameworks) {
      const totalControls = framework.controls.length;
      const mappedControls = framework.controls.filter(c => c.mappings.length > 0).length;
      const coveragePercent = totalControls > 0 ? Math.round((mappedControls / totalControls) * 100) : 0;

      if (coveragePercent < 50) {
        contextQuestions.push({
          label: `${framework.code} Gaps`,
          query: `Our ${framework.name} coverage is only ${coveragePercent}%. What are the most critical gaps to address?`,
          category: 'compliance',
          priority: 1,
        });
      } else if (coveragePercent < 80) {
        contextQuestions.push({
          label: `Improve ${framework.code}`,
          query: `How can we improve our ${framework.name} compliance from ${coveragePercent}% to 80%?`,
          category: 'compliance',
          priority: 2,
        });
      }
    }

    // Posture-based questions
    if (latestSnapshot) {
      if (latestSnapshot.overallScore < 60) {
        contextQuestions.push({
          label: "Improve Posture",
          query: `Our security posture score is ${latestSnapshot.overallScore}/100. What quick wins can improve this?`,
          category: 'strategy',
          priority: 1,
        });
      }

      if (latestSnapshot.maturityLevel < 3) {
        contextQuestions.push({
          label: "Increase Maturity",
          query: `We're at maturity level ${latestSnapshot.maturityLevel}. What's needed to reach level 3?`,
          category: 'strategy',
          priority: 2,
        });
      }
    }

    // Combine all questions
    let allQuestions: QuickQuestion[] = [
      ...contextQuestions,
      ...(roleSpecificQuestions[userRole] || []),
      ...baseQuestions,
    ];

    // Remove duplicates and sort by priority
    const seen = new Set<string>();
    allQuestions = allQuestions.filter(q => {
      if (seen.has(q.label)) return false;
      seen.add(q.label);
      return true;
    });

    // Sort by priority (lower is higher priority)
    allQuestions.sort((a, b) => a.priority - b.priority);

    // Shuffle within same priority for variety
    const shuffleWithinPriority = (questions: QuickQuestion[]) => {
      const grouped: Record<number, QuickQuestion[]> = {};
      questions.forEach(q => {
        if (!grouped[q.priority]) grouped[q.priority] = [];
        grouped[q.priority].push(q);
      });

      const result: QuickQuestion[] = [];
      Object.keys(grouped).sort().forEach(priority => {
        const group = grouped[Number(priority)];
        // Fisher-Yates shuffle
        for (let i = group.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [group[i], group[j]] = [group[j], group[i]];
        }
        result.push(...group);
      });

      return result;
    };

    allQuestions = shuffleWithinPriority(allQuestions);

    // Return top 6 questions
    const questions = allQuestions.slice(0, 6).map(q => ({
      label: q.label,
      query: q.query,
      category: q.category,
    }));

    return NextResponse.json({
      questions,
      context: {
        totalRisks: risks.length,
        criticalRisks: criticalRisks.length,
        totalPolicies: policies.length,
        frameworkCount: frameworks.length,
        postureScore: latestSnapshot?.overallScore || null,
        userRole,
      },
    });
  } catch (error) {
    console.error('Error generating quick questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
