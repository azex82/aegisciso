// Sample data for demo/fallback purposes

export interface FrameworkCoverage {
  code: string;
  name: string;
  totalControls: number;
  mappedControls: number;
  fullCoverage: number;
  partialCoverage: number;
  noCoverage: number;
}

export interface StrategyObjective {
  id: string;
  code: string;
  title: string;
  status: string;
  progressPercent: number;
  impactingRisks: number;
  impactLevel: string;
}

export interface TopRisk {
  id: string;
  code: string;
  title: string;
  category: string;
  inherentRiskScore: number;
  residualRiskScore: number;
  priority: number;
  status: string;
  targetDate: string | null;
  owner: { name: string } | null;
  isOverdue: boolean;
  daysOverdue?: number;
}

export function getSampleFrameworkCoverage(): FrameworkCoverage[] {
  return [
    {
      code: 'NCA_ECC',
      name: 'NCA Essential Cybersecurity Controls',
      totalControls: 114,
      mappedControls: 89,
      fullCoverage: 67,
      partialCoverage: 22,
      noCoverage: 25,
    },
    {
      code: 'NIST_CSF',
      name: 'NIST Cybersecurity Framework',
      totalControls: 108,
      mappedControls: 78,
      fullCoverage: 54,
      partialCoverage: 24,
      noCoverage: 30,
    },
    {
      code: 'ISO_27001',
      name: 'ISO/IEC 27001:2022',
      totalControls: 93,
      mappedControls: 71,
      fullCoverage: 48,
      partialCoverage: 23,
      noCoverage: 22,
    },
    {
      code: 'SAMA_CSF',
      name: 'SAMA Cyber Security Framework',
      totalControls: 89,
      mappedControls: 62,
      fullCoverage: 41,
      partialCoverage: 21,
      noCoverage: 27,
    },
  ];
}

export function getSampleStrategyImpact() {
  return {
    objectives: [
      {
        id: '1',
        code: 'SO-001',
        title: 'Achieve NCA ECC Compliance',
        status: 'IN_PROGRESS',
        progressPercent: 72,
        impactingRisks: 3,
        impactLevel: 'HIGH',
      },
      {
        id: '2',
        code: 'SO-002',
        title: 'Implement Zero Trust Architecture',
        status: 'IN_PROGRESS',
        progressPercent: 45,
        impactingRisks: 2,
        impactLevel: 'MEDIUM',
      },
      {
        id: '3',
        code: 'SO-003',
        title: 'Enhance SOC Capabilities',
        status: 'IN_PROGRESS',
        progressPercent: 60,
        impactingRisks: 1,
        impactLevel: 'MEDIUM',
      },
      {
        id: '4',
        code: 'SO-004',
        title: 'Cloud Security Posture Management',
        status: 'NOT_STARTED',
        progressPercent: 0,
        impactingRisks: 0,
        impactLevel: 'NONE',
      },
    ] as StrategyObjective[],
    totalImpactedObjectives: 3,
    strategyImpactScore: 75,
  };
}

export function getSampleTopRisks(): TopRisk[] {
  return [
    {
      id: '1',
      code: 'RISK-001',
      title: 'Ransomware Attack on Critical Infrastructure',
      category: 'Cyber Threat',
      inherentRiskScore: 25,
      residualRiskScore: 15,
      priority: 1,
      status: 'OPEN',
      targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      owner: { name: 'Ahmed Al-Rashid' },
      isOverdue: true,
      daysOverdue: 7,
    },
    {
      id: '2',
      code: 'RISK-002',
      title: 'Third-Party Vendor Data Breach',
      category: 'Supply Chain',
      inherentRiskScore: 20,
      residualRiskScore: 12,
      priority: 1,
      status: 'TREATING',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      owner: { name: 'Fatima Al-Saud' },
      isOverdue: false,
    },
    {
      id: '3',
      code: 'RISK-003',
      title: 'Privileged Access Misuse',
      category: 'Insider Threat',
      inherentRiskScore: 16,
      residualRiskScore: 8,
      priority: 2,
      status: 'OPEN',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      owner: { name: 'Mohammed Al-Zahrani' },
      isOverdue: false,
    },
    {
      id: '4',
      code: 'RISK-004',
      title: 'Cloud Misconfiguration',
      category: 'Technical',
      inherentRiskScore: 15,
      residualRiskScore: 10,
      priority: 2,
      status: 'TREATING',
      targetDate: null,
      owner: { name: 'Sara Al-Ghamdi' },
      isOverdue: false,
    },
    {
      id: '5',
      code: 'RISK-005',
      title: 'DDoS Attack on Customer Portal',
      category: 'Cyber Threat',
      inherentRiskScore: 12,
      residualRiskScore: 6,
      priority: 3,
      status: 'OPEN',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      owner: { name: 'Khalid Al-Otaibi' },
      isOverdue: false,
    },
  ];
}
