/**
 * Seed Data for SABIC AI Cybersecurity Director Platform
 * Includes NCA ECC-based policies, sample risks, and posture snapshots
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Helper to hash passwords
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// NCA ECC Framework Controls
const ncaEccControls = [
  { code: 'NCA-1-1', title: 'Cybersecurity Governance', category: 'Governance', description: 'Establish cybersecurity governance structure' },
  { code: 'NCA-1-2', title: 'Cybersecurity Strategy', category: 'Governance', description: 'Develop and maintain cybersecurity strategy' },
  { code: 'NCA-1-3', title: 'Cybersecurity Policies', category: 'Governance', description: 'Establish cybersecurity policies framework' },
  { code: 'NCA-1-4', title: 'Cybersecurity Roles', category: 'Governance', description: 'Define cybersecurity roles and responsibilities' },
  { code: 'NCA-1-5', title: 'Risk Management', category: 'Governance', description: 'Implement cybersecurity risk management' },
  { code: 'NCA-2-1', title: 'Asset Management', category: 'Defense', description: 'Maintain inventory of information assets' },
  { code: 'NCA-2-2', title: 'Identity Management', category: 'Defense', description: 'Manage identities and access' },
  { code: 'NCA-2-3', title: 'Access Control', category: 'Defense', description: 'Implement access control mechanisms' },
  { code: 'NCA-2-4', title: 'Network Security', category: 'Defense', description: 'Secure network infrastructure' },
  { code: 'NCA-2-5', title: 'Data Protection', category: 'Defense', description: 'Protect sensitive data' },
  { code: 'NCA-2-6', title: 'Cryptography', category: 'Defense', description: 'Implement cryptographic controls' },
  { code: 'NCA-2-7', title: 'Endpoint Security', category: 'Defense', description: 'Secure endpoint devices' },
  { code: 'NCA-2-8', title: 'Application Security', category: 'Defense', description: 'Secure applications throughout lifecycle' },
  { code: 'NCA-3-1', title: 'Security Monitoring', category: 'Resilience', description: 'Monitor for security events' },
  { code: 'NCA-3-2', title: 'Vulnerability Management', category: 'Resilience', description: 'Manage vulnerabilities systematically' },
  { code: 'NCA-3-3', title: 'Incident Response', category: 'Resilience', description: 'Respond to security incidents' },
  { code: 'NCA-3-4', title: 'Business Continuity', category: 'Resilience', description: 'Ensure business continuity' },
  { code: 'NCA-4-1', title: 'Third-Party Security', category: 'Third Party', description: 'Manage third-party security risks' },
  { code: 'NCA-4-2', title: 'Cloud Security', category: 'Third Party', description: 'Secure cloud services' },
  { code: 'NCA-5-1', title: 'Industrial Control Systems', category: 'ICS', description: 'Secure industrial control systems' },
];

// Sample policies based on NCA templates
const ncaPolicies = [
  {
    code: 'POL-GOV-001',
    title: 'Cybersecurity Governance Policy',
    description: 'Establishes the governance framework for cybersecurity across the organization, including roles, responsibilities, and accountability structures.',
    category: 'Governance',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 4,
    statements: [
      { code: 'GOV-001-01', content: 'The organization shall establish a cybersecurity governance committee to oversee security initiatives.', priority: 'CRITICAL' },
      { code: 'GOV-001-02', content: 'Executive leadership shall be informed of cybersecurity risks quarterly.', priority: 'HIGH' },
      { code: 'GOV-001-03', content: 'A Chief Information Security Officer (CISO) shall be appointed with direct reporting to executive management.', priority: 'CRITICAL' },
    ],
  },
  {
    code: 'POL-IAM-001',
    title: 'Identity and Access Management Policy',
    description: 'Defines requirements for managing user identities, authentication, and access control across all systems and applications.',
    category: 'Access Control',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
    statements: [
      { code: 'IAM-001-01', content: 'All users shall be uniquely identified before being granted access to systems.', priority: 'CRITICAL' },
      { code: 'IAM-001-02', content: 'Multi-factor authentication shall be required for access to critical systems.', priority: 'CRITICAL' },
      { code: 'IAM-001-03', content: 'Access rights shall be reviewed quarterly and revoked upon role change or termination.', priority: 'HIGH' },
      { code: 'IAM-001-04', content: 'Privileged access shall be limited and monitored continuously.', priority: 'CRITICAL' },
    ],
  },
  {
    code: 'POL-NET-001',
    title: 'Network Security Policy',
    description: 'Establishes requirements for securing network infrastructure, including segmentation, monitoring, and protection mechanisms.',
    category: 'Network Security',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
    statements: [
      { code: 'NET-001-01', content: 'Network segmentation shall be implemented to isolate critical systems.', priority: 'CRITICAL' },
      { code: 'NET-001-02', content: 'All network traffic shall be monitored and logged for security analysis.', priority: 'HIGH' },
      { code: 'NET-001-03', content: 'Firewalls shall be configured following the principle of deny-by-default.', priority: 'CRITICAL' },
    ],
  },
  {
    code: 'POL-DPR-001',
    title: 'Data Protection Policy',
    description: 'Defines requirements for protecting sensitive data throughout its lifecycle, including classification, encryption, and disposal.',
    category: 'Data Protection',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 2,
    statements: [
      { code: 'DPR-001-01', content: 'All data shall be classified according to sensitivity and criticality.', priority: 'HIGH' },
      { code: 'DPR-001-02', content: 'Sensitive data shall be encrypted at rest and in transit.', priority: 'CRITICAL' },
      { code: 'DPR-001-03', content: 'Data retention periods shall be defined and enforced for all data types.', priority: 'MEDIUM' },
    ],
  },
  {
    code: 'POL-VUL-001',
    title: 'Vulnerability Management Policy',
    description: 'Establishes requirements for identifying, assessing, and remediating security vulnerabilities across all systems.',
    category: 'Vulnerability Management',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
    statements: [
      { code: 'VUL-001-01', content: 'Vulnerability assessments shall be conducted monthly on critical systems.', priority: 'HIGH' },
      { code: 'VUL-001-02', content: 'Critical vulnerabilities shall be remediated within 7 days of identification.', priority: 'CRITICAL' },
      { code: 'VUL-001-03', content: 'Penetration testing shall be conducted annually by qualified personnel.', priority: 'HIGH' },
    ],
  },
  {
    code: 'POL-INC-001',
    title: 'Incident Response Policy',
    description: 'Defines the procedures and responsibilities for detecting, responding to, and recovering from security incidents.',
    category: 'Incident Response',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 4,
    statements: [
      { code: 'INC-001-01', content: 'A security incident response team shall be established and trained.', priority: 'CRITICAL' },
      { code: 'INC-001-02', content: 'All security incidents shall be reported within 1 hour of detection.', priority: 'CRITICAL' },
      { code: 'INC-001-03', content: 'Post-incident reviews shall be conducted for all significant incidents.', priority: 'HIGH' },
    ],
  },
  {
    code: 'POL-BCP-001',
    title: 'Business Continuity Policy',
    description: 'Establishes requirements for ensuring business continuity and disaster recovery capabilities.',
    category: 'Business Continuity',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
    statements: [
      { code: 'BCP-001-01', content: 'Business impact analysis shall be conducted annually for critical processes.', priority: 'HIGH' },
      { code: 'BCP-001-02', content: 'Disaster recovery plans shall be tested at least annually.', priority: 'HIGH' },
      { code: 'BCP-001-03', content: 'Recovery time objectives shall be defined for all critical systems.', priority: 'HIGH' },
    ],
  },
  {
    code: 'POL-TPM-001',
    title: 'Third-Party Risk Management Policy',
    description: 'Defines requirements for managing cybersecurity risks associated with third-party vendors and service providers.',
    category: 'Third Party Risk',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 2,
    statements: [
      { code: 'TPM-001-01', content: 'Security assessments shall be conducted for all critical vendors.', priority: 'HIGH' },
      { code: 'TPM-001-02', content: 'Contracts with vendors shall include security requirements and SLAs.', priority: 'HIGH' },
      { code: 'TPM-001-03', content: 'Vendor access to systems shall be monitored and logged.', priority: 'HIGH' },
    ],
  },
  {
    code: 'POL-CLD-001',
    title: 'Cloud Security Policy',
    description: 'Establishes security requirements for the use of cloud services and infrastructure.',
    category: 'Cloud Security',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
    statements: [
      { code: 'CLD-001-01', content: 'Cloud service providers shall be assessed for security compliance.', priority: 'HIGH' },
      { code: 'CLD-001-02', content: 'Data sovereignty requirements shall be enforced for cloud deployments.', priority: 'CRITICAL' },
      { code: 'CLD-001-03', content: 'Cloud configurations shall follow security hardening guidelines.', priority: 'HIGH' },
    ],
  },
  {
    code: 'POL-AWR-001',
    title: 'Security Awareness and Training Policy',
    description: 'Defines requirements for cybersecurity awareness and training programs for all personnel.',
    category: 'Awareness',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 4,
    statements: [
      { code: 'AWR-001-01', content: 'All employees shall complete security awareness training annually.', priority: 'HIGH' },
      { code: 'AWR-001-02', content: 'Phishing simulations shall be conducted quarterly.', priority: 'MEDIUM' },
      { code: 'AWR-001-03', content: 'Role-specific security training shall be provided to technical staff.', priority: 'HIGH' },
    ],
  },
];

// Sample risks
const sampleRisks = [
  {
    code: 'RSK-001',
    title: 'Insufficient Identity and Access Management Controls',
    description: 'Current IAM controls do not adequately prevent unauthorized access to critical systems.',
    category: 'Access Control',
    source: 'Internal Audit',
    inherentLikelihood: 4,
    inherentImpact: 5,
    residualLikelihood: 3,
    residualImpact: 4,
    priority: 1,
    status: 'TREATING',
    treatmentPlan: 'Implement MFA across all critical systems and enhance access review processes.',
  },
  {
    code: 'RSK-002',
    title: 'Unpatched Critical Vulnerabilities in Production',
    description: 'Multiple critical vulnerabilities remain unpatched in production systems beyond SLA.',
    category: 'Vulnerability Management',
    source: 'Vulnerability Scan',
    inherentLikelihood: 5,
    inherentImpact: 5,
    residualLikelihood: 4,
    residualImpact: 4,
    priority: 1,
    status: 'TREATING',
    treatmentPlan: 'Establish emergency patching process and increase patching frequency.',
  },
  {
    code: 'RSK-003',
    title: 'Inadequate Security Monitoring and Logging',
    description: 'Security events are not adequately monitored, leading to delayed incident detection.',
    category: 'Security Operations',
    source: 'Gap Assessment',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    priority: 2,
    status: 'MONITORING',
    treatmentPlan: 'Deploy SIEM solution and establish 24/7 monitoring capability.',
  },
  {
    code: 'RSK-004',
    title: 'Third-Party Security Assessment Gaps',
    description: 'Critical vendors have not undergone required security assessments.',
    category: 'Third Party Risk',
    source: 'Compliance Review',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    priority: 2,
    status: 'ASSESSING',
    treatmentPlan: 'Conduct security assessments for all Tier 1 vendors.',
  },
  {
    code: 'RSK-005',
    title: 'Cloud Security Misconfigurations',
    description: 'Multiple security misconfigurations identified in cloud infrastructure.',
    category: 'Cloud Security',
    source: 'Cloud Security Audit',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    priority: 3,
    status: 'TREATING',
    treatmentPlan: 'Implement CSPM solution and remediate identified misconfigurations.',
  },
  {
    code: 'RSK-006',
    title: 'Insufficient Data Protection Controls',
    description: 'Sensitive data is not adequately classified and protected.',
    category: 'Data Protection',
    source: 'Data Assessment',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    priority: 2,
    status: 'TREATING',
    treatmentPlan: 'Implement DLP solution and data classification program.',
  },
  {
    code: 'RSK-007',
    title: 'Weak Endpoint Security Posture',
    description: 'Endpoint devices lack adequate security controls and monitoring.',
    category: 'Endpoint Security',
    source: 'Security Assessment',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    priority: 3,
    status: 'TREATING',
    treatmentPlan: 'Deploy EDR solution and enhance endpoint hardening.',
  },
  {
    code: 'RSK-008',
    title: 'Lack of Network Segmentation',
    description: 'Network is flat without adequate segmentation between zones.',
    category: 'Network Security',
    source: 'Network Assessment',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    priority: 2,
    status: 'TREATING',
    treatmentPlan: 'Implement network segmentation and micro-segmentation.',
  },
];

// Sample strategy objectives
const strategyObjectives = [
  {
    code: 'OBJ-001',
    title: 'Implement Zero Trust Architecture',
    description: 'Transform security architecture to zero trust model',
    category: 'Architecture',
    priority: 'CRITICAL',
    status: 'AT_RISK',
    progressPercent: 45,
    fiscalYear: 'FY2026',
    quarter: 'Q1',
  },
  {
    code: 'OBJ-002',
    title: 'Achieve NCA ECC Compliance',
    description: 'Full compliance with NCA Essential Cybersecurity Controls',
    category: 'Compliance',
    priority: 'CRITICAL',
    status: 'ON_TRACK',
    progressPercent: 72,
    fiscalYear: 'FY2026',
    quarter: 'Q1',
  },
  {
    code: 'OBJ-003',
    title: 'Deploy Enterprise SIEM Solution',
    description: 'Implement centralized security monitoring',
    category: 'Security Operations',
    priority: 'HIGH',
    status: 'DELAYED',
    progressPercent: 30,
    fiscalYear: 'FY2026',
    quarter: 'Q2',
  },
  {
    code: 'OBJ-004',
    title: 'Security Awareness Training Program',
    description: 'Establish comprehensive security awareness program',
    category: 'Awareness',
    priority: 'HIGH',
    status: 'ON_TRACK',
    progressPercent: 85,
    fiscalYear: 'FY2026',
    quarter: 'Q1',
  },
  {
    code: 'OBJ-005',
    title: 'Cloud Security Posture Management',
    description: 'Implement CSPM for all cloud environments',
    category: 'Cloud Security',
    priority: 'HIGH',
    status: 'ON_TRACK',
    progressPercent: 60,
    fiscalYear: 'FY2026',
    quarter: 'Q2',
  },
];

async function main() {
  console.log('Starting seed...');

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'CISO' },
      update: {},
      create: { name: 'CISO', description: 'Chief Information Security Officer' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'System Administrator' },
    }),
    prisma.role.upsert({
      where: { name: 'ANALYST' },
      update: {},
      create: { name: 'ANALYST', description: 'Security Analyst' },
    }),
    prisma.role.upsert({
      where: { name: 'VIEWER' },
      update: {},
      create: { name: 'VIEWER', description: 'Read-only User' },
    }),
  ]);

  console.log('Created roles:', roles.map(r => r.name).join(', '));

  // Create users with Arabic names (transliterated)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ciso@sabic.com' },
      update: { name: 'Ahmed Almalki', passwordHash: hashPassword('CisoPass123!') },
      create: {
        email: 'ciso@sabic.com',
        passwordHash: hashPassword('CisoPass123!'),
        name: 'Ahmed Almalki',
        title: 'Chief Information Security Officer',
        department: 'Information Security',
        roleId: roles[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@sabic.com' },
      update: { name: 'Noura bint Khalid Al-Qahtani' },
      create: {
        email: 'admin@sabic.com',
        passwordHash: hashPassword('AdminPass123!'),
        name: 'Noura bint Khalid Al-Qahtani',
        title: 'Security Administrator',
        department: 'Information Security',
        roleId: roles[1].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@sabic.com' },
      update: { name: 'Khalid bin Saad Al-Ghamdi' },
      create: {
        email: 'analyst@sabic.com',
        passwordHash: hashPassword('AnalystPass123!'),
        name: 'Khalid bin Saad Al-Ghamdi',
        title: 'Security Analyst',
        department: 'Information Security',
        roleId: roles[2].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@sabic.com' },
      update: { name: 'Maha bint Abdullah Al-Mutairi' },
      create: {
        email: 'viewer@sabic.com',
        passwordHash: hashPassword('ViewerPass123!'),
        name: 'Maha bint Abdullah Al-Mutairi',
        title: 'Compliance Manager',
        department: 'Compliance',
        roleId: roles[3].id,
      },
    }),
  ]);

  console.log('Created users:', users.map(u => u.email).join(', '));

  // Create NCA ECC Framework
  const ncaFramework = await prisma.framework.upsert({
    where: { code: 'NCA_ECC' },
    update: {},
    create: {
      code: 'NCA_ECC',
      name: 'NCA Essential Cybersecurity Controls',
      version: '2.0',
      description: 'Saudi National Cybersecurity Authority Essential Cybersecurity Controls',
      category: 'Regulatory',
    },
  });

  // Create other frameworks
  const frameworks = await Promise.all([
    prisma.framework.upsert({
      where: { code: 'NIST_CSF' },
      update: {},
      create: {
        code: 'NIST_CSF',
        name: 'NIST Cybersecurity Framework',
        version: '2.0',
        description: 'NIST Cybersecurity Framework',
        category: 'Best Practice',
      },
    }),
    prisma.framework.upsert({
      where: { code: 'ISO_27001' },
      update: {},
      create: {
        code: 'ISO_27001',
        name: 'ISO/IEC 27001:2022',
        version: '2022',
        description: 'ISO Information Security Management System',
        category: 'International Standard',
      },
    }),
    prisma.framework.upsert({
      where: { code: 'SAMA_CSF' },
      update: {},
      create: {
        code: 'SAMA_CSF',
        name: 'SAMA Cyber Security Framework',
        version: '1.0',
        description: 'Saudi Central Bank Cyber Security Framework',
        category: 'Regulatory',
      },
    }),
  ]);

  console.log('Created frameworks');

  // Create NCA ECC controls
  for (const control of ncaEccControls) {
    await prisma.frameworkControl.upsert({
      where: {
        frameworkId_code: {
          frameworkId: ncaFramework.id,
          code: control.code,
        },
      },
      update: {},
      create: {
        frameworkId: ncaFramework.id,
        code: control.code,
        title: control.title,
        category: control.category,
        description: control.description,
      },
    });
  }

  console.log('Created NCA ECC controls');

  // Create policies
  for (const policyData of ncaPolicies) {
    const policy = await prisma.policy.upsert({
      where: { code: policyData.code },
      update: {},
      create: {
        code: policyData.code,
        title: policyData.title,
        description: policyData.description,
        category: policyData.category,
        frameworkSource: policyData.frameworkSource,
        maturityLevel: policyData.maturityLevel,
        status: 'PUBLISHED',
        version: '1.0',
        ownerId: users[0].id,
        effectiveDate: new Date('2025-06-01'),
        reviewDate: new Date('2026-06-01'),
        expiryDate: new Date('2027-06-01'),
        validityStatus: 'VALID',
      },
    });

    // Create policy statements
    for (const stmt of policyData.statements) {
      await prisma.policyStatement.upsert({
        where: {
          policyId_code: {
            policyId: policy.id,
            code: stmt.code,
          },
        },
        update: {},
        create: {
          policyId: policy.id,
          code: stmt.code,
          content: stmt.content,
          priority: stmt.priority as any,
          status: 'ACTIVE',
        },
      });
    }
  }

  console.log('Created policies with statements');

  // Create risks with remediation plans
  for (const riskData of sampleRisks) {
    const risk = await prisma.risk.upsert({
      where: { code: riskData.code },
      update: {},
      create: {
        code: riskData.code,
        title: riskData.title,
        description: riskData.description,
        category: riskData.category,
        source: riskData.source,
        inherentLikelihood: riskData.inherentLikelihood,
        inherentImpact: riskData.inherentImpact,
        inherentRiskScore: riskData.inherentLikelihood * riskData.inherentImpact,
        residualLikelihood: riskData.residualLikelihood,
        residualImpact: riskData.residualImpact,
        residualRiskScore: riskData.residualLikelihood * riskData.residualImpact,
        priority: riskData.priority,
        status: riskData.status as any,
        treatmentPlan: riskData.treatmentPlan,
        treatmentStatus: 'IN_PROGRESS',
        ownerId: users[Math.floor(Math.random() * users.length)].id,
        targetDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      },
    });

    // Create remediation plan for each risk
    if (riskData.status === 'TREATING') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 10); // Some overdue

      await prisma.remediationPlan.create({
        data: {
          riskId: risk.id,
          title: `Remediation for ${riskData.code}`,
          description: riskData.treatmentPlan,
          status: dueDate < new Date() ? 'OVERDUE' : 'IN_PROGRESS',
          priority: riskData.priority,
          progress: Math.floor(Math.random() * 80),
          dueDate: dueDate,
          ownerId: users[Math.floor(Math.random() * users.length)].id,
        },
      });
    }
  }

  console.log('Created risks with remediation plans');

  // Create strategy objectives
  for (const objData of strategyObjectives) {
    await prisma.strategyObjective.upsert({
      where: { code: objData.code },
      update: {},
      create: {
        code: objData.code,
        title: objData.title,
        description: objData.description,
        category: objData.category,
        priority: objData.priority as any,
        status: objData.status as any,
        progressPercent: objData.progressPercent,
        fiscalYear: objData.fiscalYear,
        quarter: objData.quarter,
        ownerId: users[0].id,
        targetDate: new Date('2026-12-31'),
      },
    });
  }

  console.log('Created strategy objectives');

  // Create posture snapshots (historical data for trend chart)
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 12);

  for (let i = 0; i < 12; i++) {
    const snapshotDate = new Date(baseDate);
    snapshotDate.setMonth(snapshotDate.getMonth() + i);

    // Simulating gradual improvement
    const improvementFactor = i * 2;

    await prisma.postureSnapshot.create({
      data: {
        snapshotDate,
        overallScore: Math.min(100, 55 + improvementFactor + Math.floor(Math.random() * 5)),
        policyHealthScore: Math.min(100, 60 + improvementFactor + Math.floor(Math.random() * 5)),
        complianceCoverage: Math.min(100, 50 + improvementFactor + Math.floor(Math.random() * 5)),
        riskExposureScore: Math.max(0, 80 - improvementFactor - Math.floor(Math.random() * 5)),
        strategyAlignmentScore: Math.min(100, 55 + improvementFactor + Math.floor(Math.random() * 5)),
        maturityLevel: Math.min(5, 2 + Math.floor(i / 4)),
        totalPolicies: 10,
        activePolicies: 8 + Math.floor(i / 6),
        policiesNeedingReview: Math.max(0, 3 - Math.floor(i / 4)),
        policiesExpiringSoon: Math.max(0, 2 - Math.floor(i / 6)),
        policyViolations: Math.max(0, 5 - Math.floor(i / 3)),
        totalRisks: 8,
        criticalRisks: Math.max(0, 3 - Math.floor(i / 4)),
        highRisks: Math.max(0, 4 - Math.floor(i / 4)),
        mediumRisks: 2,
        lowRisks: 1 + Math.floor(i / 4),
        risksWithoutControls: Math.max(0, 2 - Math.floor(i / 6)),
        overdueRemediations: Math.max(0, 3 - Math.floor(i / 4)),
        totalRemediations: 6,
        completedRemediations: Math.min(6, Math.floor(i / 2)),
        totalControls: 20,
        implementedControls: 12 + Math.floor(i / 2),
        totalObjectives: 5,
        objectivesOnTrack: 2 + Math.floor(i / 4),
        objectivesAtRisk: Math.max(0, 2 - Math.floor(i / 6)),
        objectivesImpactedByRisk: Math.max(0, 3 - Math.floor(i / 4)),
        overdueActions: Math.max(0, 4 - Math.floor(i / 3)),
        strategyImpactScore: Math.max(0, 40 - improvementFactor),
      },
    });
  }

  console.log('Created posture snapshot history');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
