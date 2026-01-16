import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.kPIMeasurement.deleteMany();
  await prisma.kPI.deleteMany();
  await prisma.objectiveControlLink.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.strategyObjective.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.evidenceArtifact.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.riskControlLink.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.mapping.deleteMany();
  await prisma.frameworkControl.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.policyStatement.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.postureSnapshot.deleteMany();

  console.log('✅ Cleaned existing data');

  // ============================================
  // ROLES
  // ============================================
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'CISO',
        description: 'Chief Information Security Officer - Full access to all features',
      },
    }),
    prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator - Manage users, roles, and system settings',
      },
    }),
    prisma.role.create({
      data: {
        name: 'ANALYST',
        description: 'Security Analyst - Read/write access to policies, risks, and findings',
      },
    }),
    prisma.role.create({
      data: {
        name: 'VIEWER',
        description: 'Viewer - Read-only access to dashboards and reports',
      },
    }),
  ]);

  const [cisoRole, adminRole, analystRole, viewerRole] = roles;
  console.log('✅ Created roles');

  // ============================================
  // PERMISSIONS
  // ============================================
  const resources = ['policy', 'risk', 'framework', 'objective', 'finding', 'exception', 'user', 'audit'];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissions = await Promise.all(
    resources.flatMap((resource) =>
      actions.map((action) =>
        prisma.permission.create({
          data: {
            name: `${resource}:${action}`,
            description: `Can ${action} ${resource}s`,
            resource,
            action,
          },
        })
      )
    )
  );

  console.log('✅ Created permissions');

  // Assign permissions to roles
  const allPermissions = permissions;
  const readPermissions = permissions.filter((p) => p.action === 'read');
  const readWritePermissions = permissions.filter((p) => ['read', 'create', 'update'].includes(p.action));

  // CISO gets all permissions
  await Promise.all(
    allPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: cisoRole.id, permissionId: p.id },
      })
    )
  );

  // ADMIN gets all permissions
  await Promise.all(
    allPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: p.id },
      })
    )
  );

  // ANALYST gets read/write but not delete
  await Promise.all(
    readWritePermissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: analystRole.id, permissionId: p.id },
      })
    )
  );

  // VIEWER gets read only
  await Promise.all(
    readPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: viewerRole.id, permissionId: p.id },
      })
    )
  );

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // USERS (Arabic names)
  // ============================================
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ciso@sabic.com',
        passwordHash: hashPassword('CisoPass123!'),
        name: 'Ahmed Almalki',
        title: 'Chief Information Security Officer',
        department: 'Information Security',
        roleId: cisoRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@sabic.com',
        passwordHash: hashPassword('AdminPass123!'),
        name: 'Noura bint Khalid Al-Qahtani',
        title: 'Security Administrator',
        department: 'Information Security',
        roleId: adminRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'analyst@sabic.com',
        passwordHash: hashPassword('AnalystPass123!'),
        name: 'Khalid bin Saad Al-Ghamdi',
        title: 'Senior Security Analyst',
        department: 'Information Security',
        roleId: analystRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@sabic.com',
        passwordHash: hashPassword('ViewerPass123!'),
        name: 'Maha bint Abdullah Al-Mutairi',
        title: 'Compliance Officer',
        department: 'Compliance',
        roleId: viewerRole.id,
      },
    }),
  ]);

  const [cisoUser, adminUser, analystUser, viewerUser] = users;
  console.log('✅ Created users');

  // ============================================
  // FRAMEWORKS
  // ============================================
  const nistFramework = await prisma.framework.create({
    data: {
      code: 'NIST-CSF',
      name: 'NIST Cybersecurity Framework',
      version: '2.0',
      description: 'Framework for Improving Critical Infrastructure Cybersecurity',
      category: 'Industry',
    },
  });

  const iso27001Framework = await prisma.framework.create({
    data: {
      code: 'ISO27001',
      name: 'ISO/IEC 27001:2022',
      version: '2022',
      description: 'Information Security Management Systems',
      category: 'International',
    },
  });

  const soc2Framework = await prisma.framework.create({
    data: {
      code: 'SOC2',
      name: 'SOC 2 Type II',
      version: '2017',
      description: 'Service Organization Control 2',
      category: 'Industry',
    },
  });

  console.log('✅ Created frameworks');

  // ============================================
  // FRAMEWORK CONTROLS
  // ============================================
  const nistControls = await Promise.all([
    prisma.frameworkControl.create({
      data: {
        frameworkId: nistFramework.id,
        code: 'ID.AM-1',
        title: 'Asset Inventory',
        description: 'Physical devices and systems within the organization are inventoried',
        category: 'Identify',
        subCategory: 'Asset Management',
        priority: 'High',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: nistFramework.id,
        code: 'PR.AC-1',
        title: 'Identity Management',
        description: 'Identities and credentials are issued, managed, verified, revoked, and audited',
        category: 'Protect',
        subCategory: 'Access Control',
        priority: 'Critical',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: nistFramework.id,
        code: 'DE.CM-1',
        title: 'Network Monitoring',
        description: 'The network is monitored to detect potential cybersecurity events',
        category: 'Detect',
        subCategory: 'Continuous Monitoring',
        priority: 'High',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: nistFramework.id,
        code: 'RS.RP-1',
        title: 'Incident Response Plan',
        description: 'Response plan is executed during or after an incident',
        category: 'Respond',
        subCategory: 'Response Planning',
        priority: 'Critical',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: nistFramework.id,
        code: 'RC.RP-1',
        title: 'Recovery Plan',
        description: 'Recovery plan is executed during or after a cybersecurity incident',
        category: 'Recover',
        subCategory: 'Recovery Planning',
        priority: 'High',
      },
    }),
  ]);

  const isoControls = await Promise.all([
    prisma.frameworkControl.create({
      data: {
        frameworkId: iso27001Framework.id,
        code: 'A.5.1',
        title: 'Policies for Information Security',
        description: 'Information security policy and topic-specific policies shall be defined',
        category: 'Organizational Controls',
        priority: 'High',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: iso27001Framework.id,
        code: 'A.8.1',
        title: 'User Endpoint Devices',
        description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected',
        category: 'Technological Controls',
        priority: 'High',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: iso27001Framework.id,
        code: 'A.8.15',
        title: 'Logging',
        description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced',
        category: 'Technological Controls',
        priority: 'Medium',
      },
    }),
  ]);

  const soc2Controls = await Promise.all([
    prisma.frameworkControl.create({
      data: {
        frameworkId: soc2Framework.id,
        code: 'CC6.1',
        title: 'Logical Access Security',
        description: 'The entity implements logical access security software, infrastructure, and architectures',
        category: 'Common Criteria',
        subCategory: 'Logical and Physical Access',
        priority: 'Critical',
      },
    }),
    prisma.frameworkControl.create({
      data: {
        frameworkId: soc2Framework.id,
        code: 'CC7.2',
        title: 'System Monitoring',
        description: 'The entity monitors system components and the operation of those components for anomalies',
        category: 'Common Criteria',
        subCategory: 'System Operations',
        priority: 'High',
      },
    }),
  ]);

  console.log('✅ Created framework controls');

  // ============================================
  // POLICIES
  // ============================================
  const policies = await Promise.all([
    prisma.policy.create({
      data: {
        code: 'POL-SEC-001',
        title: 'Information Security Policy',
        description: 'Enterprise-wide information security policy establishing the security governance framework',
        version: '2.1',
        status: 'PUBLISHED',
        effectiveDate: new Date('2024-01-01'),
        reviewDate: new Date('2025-01-01'),
        category: 'Security',
        department: 'Information Security',
        ownerId: cisoUser.id,
      },
    }),
    prisma.policy.create({
      data: {
        code: 'POL-ACC-001',
        title: 'Access Control Policy',
        description: 'Policy governing access to information systems and data',
        version: '1.5',
        status: 'PUBLISHED',
        effectiveDate: new Date('2024-02-01'),
        reviewDate: new Date('2025-02-01'),
        category: 'Access Control',
        department: 'Information Security',
        ownerId: cisoUser.id,
      },
    }),
    prisma.policy.create({
      data: {
        code: 'POL-INC-001',
        title: 'Incident Response Policy',
        description: 'Policy for responding to and managing security incidents',
        version: '1.3',
        status: 'PUBLISHED',
        effectiveDate: new Date('2024-03-01'),
        reviewDate: new Date('2025-03-01'),
        category: 'Incident Response',
        department: 'Information Security',
        ownerId: analystUser.id,
      },
    }),
    prisma.policy.create({
      data: {
        code: 'POL-DRP-001',
        title: 'Disaster Recovery Policy',
        description: 'Policy for business continuity and disaster recovery procedures',
        version: '1.0',
        status: 'UNDER_REVIEW',
        category: 'Business Continuity',
        department: 'Information Security',
        ownerId: cisoUser.id,
      },
    }),
    prisma.policy.create({
      data: {
        code: 'POL-VND-001',
        title: 'Vendor Security Policy',
        description: 'Policy for third-party vendor security requirements',
        version: '0.5',
        status: 'DRAFT',
        category: 'Third Party',
        department: 'Procurement',
        ownerId: analystUser.id,
      },
    }),
  ]);

  const [secPolicy, accPolicy, incPolicy, drpPolicy, vndPolicy] = policies;
  console.log('✅ Created policies');

  // ============================================
  // POLICY STATEMENTS
  // ============================================
  const policyStatements = await Promise.all([
    // Information Security Policy statements
    prisma.policyStatement.create({
      data: {
        policyId: secPolicy.id,
        code: 'SEC-001-01',
        content: 'All employees must complete annual security awareness training within 30 days of hire and annually thereafter.',
        requirement: 'Mandatory security awareness training',
        guidance: 'Training records must be maintained for 3 years',
        priority: 'HIGH',
        status: 'ACTIVE',
        wordingScore: 92,
        wordingFlags: [],
      },
    }),
    prisma.policyStatement.create({
      data: {
        policyId: secPolicy.id,
        code: 'SEC-001-02',
        content: 'Information assets shall be classified according to their sensitivity and criticality to business operations.',
        requirement: 'Asset classification',
        guidance: 'Use the data classification matrix',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        wordingScore: 88,
        wordingFlags: ['consider replacing shall with must'],
      },
    }),
    // Access Control Policy statements
    prisma.policyStatement.create({
      data: {
        policyId: accPolicy.id,
        code: 'ACC-001-01',
        content: 'Access to systems must be granted based on the principle of least privilege.',
        requirement: 'Least privilege access',
        priority: 'CRITICAL',
        status: 'ACTIVE',
        wordingScore: 95,
        wordingFlags: [],
      },
    }),
    prisma.policyStatement.create({
      data: {
        policyId: accPolicy.id,
        code: 'ACC-001-02',
        content: 'Multi-factor authentication must be enabled for all privileged accounts and remote access.',
        requirement: 'MFA requirement',
        priority: 'CRITICAL',
        status: 'ACTIVE',
        wordingScore: 97,
        wordingFlags: [],
      },
    }),
    prisma.policyStatement.create({
      data: {
        policyId: accPolicy.id,
        code: 'ACC-001-03',
        content: 'User access should be reviewed quarterly and access removed within 24 hours of termination.',
        requirement: 'Access review and termination',
        priority: 'HIGH',
        status: 'ACTIVE',
        wordingScore: 78,
        wordingFlags: ['should is weak - consider must', 'specify review responsibility'],
      },
    }),
    // Incident Response Policy statements
    prisma.policyStatement.create({
      data: {
        policyId: incPolicy.id,
        code: 'INC-001-01',
        content: 'All security incidents must be reported to the Security Operations Center within 1 hour of detection.',
        requirement: 'Incident reporting timeline',
        priority: 'CRITICAL',
        status: 'ACTIVE',
        wordingScore: 94,
        wordingFlags: [],
      },
    }),
    prisma.policyStatement.create({
      data: {
        policyId: incPolicy.id,
        code: 'INC-001-02',
        content: 'Post-incident reviews must be conducted for all high and critical severity incidents.',
        requirement: 'Post-incident review',
        priority: 'HIGH',
        status: 'ACTIVE',
        wordingScore: 91,
        wordingFlags: [],
      },
    }),
  ]);

  console.log('✅ Created policy statements');

  // ============================================
  // MAPPINGS
  // ============================================
  await Promise.all([
    // Map access control statements to NIST PR.AC-1
    prisma.mapping.create({
      data: {
        policyStatementId: policyStatements[2].id,
        frameworkControlId: nistControls[1].id,
        mappingType: 'IMPLEMENTS',
        coverageLevel: 'FULL',
        confidence: 95,
        isAiSuggested: true,
        isVerified: true,
      },
    }),
    prisma.mapping.create({
      data: {
        policyStatementId: policyStatements[3].id,
        frameworkControlId: nistControls[1].id,
        mappingType: 'SUPPORTS',
        coverageLevel: 'PARTIAL',
        confidence: 88,
        isAiSuggested: true,
        isVerified: true,
      },
    }),
    // Map incident response to NIST RS.RP-1
    prisma.mapping.create({
      data: {
        policyStatementId: policyStatements[5].id,
        frameworkControlId: nistControls[3].id,
        mappingType: 'IMPLEMENTS',
        coverageLevel: 'PARTIAL',
        confidence: 82,
        isAiSuggested: true,
        isVerified: false,
      },
    }),
    // Map to ISO controls
    prisma.mapping.create({
      data: {
        policyStatementId: policyStatements[0].id,
        frameworkControlId: isoControls[0].id,
        mappingType: 'SUPPORTS',
        coverageLevel: 'PARTIAL',
        confidence: 75,
        isAiSuggested: true,
        isVerified: false,
      },
    }),
    // Map to SOC2 controls
    prisma.mapping.create({
      data: {
        policyStatementId: policyStatements[2].id,
        frameworkControlId: soc2Controls[0].id,
        mappingType: 'IMPLEMENTS',
        coverageLevel: 'FULL',
        confidence: 90,
        isAiSuggested: false,
        isVerified: true,
      },
    }),
  ]);

  console.log('✅ Created mappings');

  // ============================================
  // RISKS
  // ============================================
  const risks = await Promise.all([
    prisma.risk.create({
      data: {
        code: 'RSK-001',
        title: 'Ransomware Attack',
        description: 'Risk of ransomware compromising critical systems and data',
        category: 'Cyber Threat',
        source: 'External',
        inherentLikelihood: 4,
        inherentImpact: 5,
        inherentRiskScore: 20,
        residualLikelihood: 2,
        residualImpact: 4,
        residualRiskScore: 8,
        status: 'TREATING',
        treatmentPlan: 'Implement EDR, backup strategy, and security awareness training',
        treatmentStatus: 'IN_PROGRESS',
        ownerId: cisoUser.id,
      },
    }),
    prisma.risk.create({
      data: {
        code: 'RSK-002',
        title: 'Data Breach via Third Party',
        description: 'Risk of data breach through vendor or partner access',
        category: 'Third Party',
        source: 'External',
        inherentLikelihood: 3,
        inherentImpact: 5,
        inherentRiskScore: 15,
        residualLikelihood: 2,
        residualImpact: 4,
        residualRiskScore: 8,
        status: 'MONITORING',
        treatmentPlan: 'Vendor security assessments and contract requirements',
        treatmentStatus: 'COMPLETED',
        ownerId: analystUser.id,
      },
    }),
    prisma.risk.create({
      data: {
        code: 'RSK-003',
        title: 'Insider Threat',
        description: 'Risk of malicious or negligent actions by internal personnel',
        category: 'People',
        source: 'Internal',
        inherentLikelihood: 3,
        inherentImpact: 4,
        inherentRiskScore: 12,
        residualLikelihood: 2,
        residualImpact: 3,
        residualRiskScore: 6,
        status: 'TREATING',
        treatmentPlan: 'DLP implementation and access monitoring',
        treatmentStatus: 'IN_PROGRESS',
        ownerId: cisoUser.id,
      },
    }),
    prisma.risk.create({
      data: {
        code: 'RSK-004',
        title: 'Cloud Misconfiguration',
        description: 'Risk of data exposure due to cloud service misconfiguration',
        category: 'Technology',
        source: 'Internal',
        inherentLikelihood: 4,
        inherentImpact: 4,
        inherentRiskScore: 16,
        residualLikelihood: 2,
        residualImpact: 3,
        residualRiskScore: 6,
        status: 'TREATING',
        treatmentPlan: 'CSPM implementation and configuration reviews',
        treatmentStatus: 'IN_PROGRESS',
        ownerId: analystUser.id,
      },
    }),
    prisma.risk.create({
      data: {
        code: 'RSK-005',
        title: 'Compliance Violation',
        description: 'Risk of regulatory non-compliance penalties',
        category: 'Compliance',
        source: 'Internal',
        inherentLikelihood: 2,
        inherentImpact: 4,
        inherentRiskScore: 8,
        status: 'IDENTIFIED',
        ownerId: viewerUser.id,
      },
    }),
  ]);

  console.log('✅ Created risks');

  // ============================================
  // RISK CONTROL LINKS
  // ============================================
  await Promise.all([
    prisma.riskControlLink.create({
      data: {
        riskId: risks[0].id,
        policyId: incPolicy.id,
        effectiveness: 'EFFECTIVE',
        notes: 'Incident response policy provides detection and response procedures',
      },
    }),
    prisma.riskControlLink.create({
      data: {
        riskId: risks[0].id,
        frameworkControlId: nistControls[3].id,
        effectiveness: 'EFFECTIVE',
      },
    }),
    prisma.riskControlLink.create({
      data: {
        riskId: risks[1].id,
        policyId: vndPolicy.id,
        effectiveness: 'PARTIALLY_EFFECTIVE',
        notes: 'Policy still in draft - needs approval',
      },
    }),
    prisma.riskControlLink.create({
      data: {
        riskId: risks[2].id,
        policyId: accPolicy.id,
        effectiveness: 'EFFECTIVE',
      },
    }),
    prisma.riskControlLink.create({
      data: {
        riskId: risks[2].id,
        frameworkControlId: nistControls[1].id,
        effectiveness: 'HIGHLY_EFFECTIVE',
      },
    }),
  ]);

  console.log('✅ Created risk control links');

  // ============================================
  // FINDINGS
  // ============================================
  const findings = await Promise.all([
    prisma.finding.create({
      data: {
        code: 'FND-001',
        title: 'MFA Not Enforced for All Admin Accounts',
        description: 'Several administrative accounts do not have MFA enabled',
        source: 'Internal Audit',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        riskId: risks[2].id,
        assigneeId: analystUser.id,
        dueDate: new Date('2025-02-15'),
        remediationPlan: 'Enable MFA for all admin accounts and update access control policy',
      },
    }),
    prisma.finding.create({
      data: {
        code: 'FND-002',
        title: 'Outdated Vulnerability Scanner Signatures',
        description: 'Vulnerability scanner signatures are 45 days out of date',
        source: 'Security Assessment',
        severity: 'MEDIUM',
        status: 'REMEDIATED',
        assigneeId: analystUser.id,
        closedDate: new Date('2025-01-05'),
        remediationPlan: 'Configure automatic signature updates',
      },
    }),
    prisma.finding.create({
      data: {
        code: 'FND-003',
        title: 'Missing Encryption at Rest for Backup Data',
        description: 'Backup storage does not have encryption at rest enabled',
        source: 'Compliance Review',
        severity: 'CRITICAL',
        status: 'OPEN',
        riskId: risks[0].id,
        assigneeId: cisoUser.id,
        dueDate: new Date('2025-01-31'),
        remediationPlan: 'Enable encryption for all backup storage volumes',
      },
    }),
    prisma.finding.create({
      data: {
        code: 'FND-004',
        title: 'Incomplete Access Review Documentation',
        description: 'Q3 access reviews lack proper documentation and sign-off',
        source: 'Internal Audit',
        severity: 'LOW',
        status: 'VERIFIED',
        assigneeId: adminUser.id,
        closedDate: new Date('2025-01-08'),
      },
    }),
  ]);

  console.log('✅ Created findings');

  // ============================================
  // EXCEPTIONS
  // ============================================
  await Promise.all([
    prisma.exception.create({
      data: {
        code: 'EXC-001',
        title: 'Legacy System MFA Exemption',
        description: 'Legacy payroll system cannot support MFA',
        justification: 'System will be decommissioned in 6 months. Compensating controls in place.',
        riskId: risks[2].id,
        status: 'APPROVED',
        approverId: cisoUser.id,
        approvalDate: new Date('2024-12-01'),
        expiryDate: new Date('2025-06-30'),
        compensatingControls: 'Network segmentation, enhanced monitoring, restricted access hours',
      },
    }),
    prisma.exception.create({
      data: {
        code: 'EXC-002',
        title: 'Vendor VPN Without Certificate Auth',
        description: 'Vendor requires VPN access but cannot support certificate-based auth',
        justification: 'Critical vendor for production support. Time-limited access required.',
        riskId: risks[1].id,
        status: 'PENDING',
        expiryDate: new Date('2025-03-31'),
        compensatingControls: 'IP whitelisting, session recording, limited access hours',
      },
    }),
  ]);

  console.log('✅ Created exceptions');

  // ============================================
  // STRATEGY OBJECTIVES
  // ============================================
  const objectives = await Promise.all([
    prisma.strategyObjective.create({
      data: {
        code: 'OBJ-001',
        title: 'Achieve Zero Trust Architecture',
        description: 'Implement zero trust security model across all systems',
        category: 'Capability',
        priority: 'CRITICAL',
        status: 'ON_TRACK',
        targetDate: new Date('2025-12-31'),
        progressPercent: 35,
        ownerId: cisoUser.id,
        fiscalYear: 'FY2025',
      },
    }),
    prisma.strategyObjective.create({
      data: {
        code: 'OBJ-002',
        title: 'Reduce Critical Risk Exposure',
        description: 'Reduce critical and high risk items by 50%',
        category: 'Risk Reduction',
        priority: 'HIGH',
        status: 'ON_TRACK',
        targetDate: new Date('2025-06-30'),
        progressPercent: 60,
        ownerId: cisoUser.id,
        fiscalYear: 'FY2025',
        quarter: 'Q2',
      },
    }),
    prisma.strategyObjective.create({
      data: {
        code: 'OBJ-003',
        title: 'SOC 2 Type II Certification',
        description: 'Obtain SOC 2 Type II certification',
        category: 'Compliance',
        priority: 'HIGH',
        status: 'AT_RISK',
        targetDate: new Date('2025-09-30'),
        progressPercent: 25,
        ownerId: viewerUser.id,
        fiscalYear: 'FY2025',
        quarter: 'Q3',
      },
    }),
    prisma.strategyObjective.create({
      data: {
        code: 'OBJ-004',
        title: 'Security Automation Program',
        description: 'Automate 80% of routine security operations',
        category: 'Capability',
        priority: 'MEDIUM',
        status: 'DELAYED',
        targetDate: new Date('2025-12-31'),
        progressPercent: 15,
        ownerId: analystUser.id,
        fiscalYear: 'FY2025',
      },
    }),
  ]);

  console.log('✅ Created strategy objectives');

  // ============================================
  // INITIATIVES
  // ============================================
  await Promise.all([
    prisma.initiative.create({
      data: {
        code: 'INI-001',
        title: 'Deploy Identity Governance Platform',
        description: 'Implement identity governance and administration solution',
        status: 'IN_PROGRESS',
        objectiveId: objectives[0].id,
        ownerId: analystUser.id,
        startDate: new Date('2025-01-15'),
        targetDate: new Date('2025-06-30'),
        progressPercent: 40,
        budget: 150000,
        actualSpend: 65000,
      },
    }),
    prisma.initiative.create({
      data: {
        code: 'INI-002',
        title: 'Network Microsegmentation',
        description: 'Implement network microsegmentation for critical systems',
        status: 'PLANNED',
        objectiveId: objectives[0].id,
        ownerId: analystUser.id,
        startDate: new Date('2025-04-01'),
        targetDate: new Date('2025-10-31'),
        progressPercent: 0,
        budget: 200000,
      },
    }),
    prisma.initiative.create({
      data: {
        code: 'INI-003',
        title: 'Risk Assessment Automation',
        description: 'Automate risk assessment and scoring workflows',
        status: 'IN_PROGRESS',
        objectiveId: objectives[1].id,
        ownerId: cisoUser.id,
        startDate: new Date('2024-11-01'),
        targetDate: new Date('2025-03-31'),
        progressPercent: 75,
        budget: 50000,
        actualSpend: 42000,
      },
    }),
    prisma.initiative.create({
      data: {
        code: 'INI-004',
        title: 'SOC 2 Gap Assessment',
        description: 'Complete gap assessment against SOC 2 requirements',
        status: 'COMPLETED',
        objectiveId: objectives[2].id,
        ownerId: viewerUser.id,
        startDate: new Date('2024-10-01'),
        targetDate: new Date('2024-12-31'),
        completionDate: new Date('2024-12-20'),
        progressPercent: 100,
        budget: 25000,
        actualSpend: 23500,
      },
    }),
  ]);

  console.log('✅ Created initiatives');

  // ============================================
  // OBJECTIVE CONTROL LINKS
  // ============================================
  await Promise.all([
    prisma.objectiveControlLink.create({
      data: {
        objectiveId: objectives[0].id,
        policyId: accPolicy.id,
        linkType: 'Enables',
        notes: 'Access control policy supports zero trust implementation',
      },
    }),
    prisma.objectiveControlLink.create({
      data: {
        objectiveId: objectives[0].id,
        frameworkControlId: nistControls[1].id,
        linkType: 'Supports',
      },
    }),
    prisma.objectiveControlLink.create({
      data: {
        objectiveId: objectives[2].id,
        frameworkControlId: soc2Controls[0].id,
        linkType: 'Depends On',
      },
    }),
  ]);

  console.log('✅ Created objective control links');

  // ============================================
  // KPIs
  // ============================================
  const kpis = await Promise.all([
    prisma.kPI.create({
      data: {
        code: 'KPI-001',
        name: 'Mean Time to Detect (MTTD)',
        description: 'Average time to detect security incidents',
        objectiveId: objectives[0].id,
        targetValue: 4,
        currentValue: 6.5,
        unit: 'hours',
        frequency: 'Monthly',
        status: 'AT_RISK',
        trend: 'IMPROVING',
        lastMeasuredAt: new Date('2025-01-10'),
      },
    }),
    prisma.kPI.create({
      data: {
        code: 'KPI-002',
        name: 'Critical Risks Open',
        description: 'Number of open critical risks',
        objectiveId: objectives[1].id,
        targetValue: 0,
        currentValue: 2,
        unit: 'count',
        frequency: 'Weekly',
        status: 'OFF_TARGET',
        trend: 'STABLE',
        lastMeasuredAt: new Date('2025-01-10'),
      },
    }),
    prisma.kPI.create({
      data: {
        code: 'KPI-003',
        name: 'SOC 2 Control Coverage',
        description: 'Percentage of SOC 2 controls with evidence',
        objectiveId: objectives[2].id,
        targetValue: 100,
        currentValue: 68,
        unit: '%',
        frequency: 'Monthly',
        status: 'AT_RISK',
        trend: 'IMPROVING',
        lastMeasuredAt: new Date('2025-01-08'),
      },
    }),
    prisma.kPI.create({
      data: {
        code: 'KPI-004',
        name: 'Security Training Completion',
        description: 'Percentage of employees completing security training',
        objectiveId: objectives[0].id,
        targetValue: 100,
        currentValue: 94,
        unit: '%',
        frequency: 'Quarterly',
        status: 'ON_TARGET',
        trend: 'STABLE',
        lastMeasuredAt: new Date('2025-01-01'),
      },
    }),
  ]);

  console.log('✅ Created KPIs');

  // ============================================
  // KPI MEASUREMENTS
  // ============================================
  await Promise.all([
    // MTTD measurements
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[0].id, value: 12, measuredAt: new Date('2024-10-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[0].id, value: 10, measuredAt: new Date('2024-11-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[0].id, value: 8, measuredAt: new Date('2024-12-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[0].id, value: 6.5, measuredAt: new Date('2025-01-10') } }),
    // Critical risks measurements
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[1].id, value: 5, measuredAt: new Date('2024-10-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[1].id, value: 4, measuredAt: new Date('2024-11-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[1].id, value: 3, measuredAt: new Date('2024-12-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[1].id, value: 2, measuredAt: new Date('2025-01-10') } }),
    // SOC 2 coverage measurements
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[2].id, value: 45, measuredAt: new Date('2024-10-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[2].id, value: 52, measuredAt: new Date('2024-11-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[2].id, value: 61, measuredAt: new Date('2024-12-01') } }),
    prisma.kPIMeasurement.create({ data: { kpiId: kpis[2].id, value: 68, measuredAt: new Date('2025-01-08') } }),
  ]);

  console.log('✅ Created KPI measurements');

  // ============================================
  // POSTURE SNAPSHOTS
  // ============================================
  await Promise.all([
    prisma.postureSnapshot.create({
      data: {
        snapshotDate: new Date('2024-10-01'),
        overallScore: 62,
        policyHealthScore: 70,
        complianceCoverage: 55,
        riskExposureScore: 58,
        strategyAlignmentScore: 65,
        totalPolicies: 3,
        activePolicies: 2,
        policiesNeedingReview: 1,
        totalRisks: 4,
        criticalRisks: 1,
        highRisks: 2,
        risksWithoutControls: 2,
        totalControls: 8,
        implementedControls: 5,
        totalObjectives: 3,
        objectivesOnTrack: 1,
        objectivesAtRisk: 1,
      },
    }),
    prisma.postureSnapshot.create({
      data: {
        snapshotDate: new Date('2024-11-01'),
        overallScore: 68,
        policyHealthScore: 75,
        complianceCoverage: 62,
        riskExposureScore: 64,
        strategyAlignmentScore: 70,
        totalPolicies: 4,
        activePolicies: 3,
        policiesNeedingReview: 1,
        totalRisks: 5,
        criticalRisks: 1,
        highRisks: 2,
        risksWithoutControls: 1,
        totalControls: 10,
        implementedControls: 7,
        totalObjectives: 4,
        objectivesOnTrack: 2,
        objectivesAtRisk: 1,
      },
    }),
    prisma.postureSnapshot.create({
      data: {
        snapshotDate: new Date('2024-12-01'),
        overallScore: 72,
        policyHealthScore: 78,
        complianceCoverage: 68,
        riskExposureScore: 70,
        strategyAlignmentScore: 72,
        totalPolicies: 5,
        activePolicies: 3,
        policiesNeedingReview: 1,
        totalRisks: 5,
        criticalRisks: 1,
        highRisks: 1,
        risksWithoutControls: 1,
        totalControls: 10,
        implementedControls: 8,
        totalObjectives: 4,
        objectivesOnTrack: 2,
        objectivesAtRisk: 1,
      },
    }),
    prisma.postureSnapshot.create({
      data: {
        snapshotDate: new Date('2025-01-01'),
        overallScore: 75,
        policyHealthScore: 80,
        complianceCoverage: 72,
        riskExposureScore: 74,
        strategyAlignmentScore: 74,
        totalPolicies: 5,
        activePolicies: 3,
        policiesNeedingReview: 1,
        totalRisks: 5,
        criticalRisks: 1,
        highRisks: 1,
        risksWithoutControls: 0,
        totalControls: 10,
        implementedControls: 9,
        totalObjectives: 4,
        objectivesOnTrack: 2,
        objectivesAtRisk: 2,
      },
    }),
  ]);

  console.log('✅ Created posture snapshots');

  // ============================================
  // AUDIT LOGS
  // ============================================
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: cisoUser.id,
        action: 'LOGIN',
        resource: 'auth',
        details: { method: 'credentials' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: cisoUser.id,
        action: 'UPDATE',
        resource: 'policy',
        resourceId: secPolicy.id,
        details: { field: 'status', oldValue: 'DRAFT', newValue: 'PUBLISHED' },
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: analystUser.id,
        action: 'CREATE',
        resource: 'risk',
        resourceId: risks[3].id,
        details: { title: 'Cloud Misconfiguration' },
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREATE',
        resource: 'user',
        resourceId: viewerUser.id,
        details: { email: 'viewer@aegisciso.com', role: 'VIEWER' },
      },
    }),
  ]);

  console.log('✅ Created audit logs');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  CISO:    ciso@sabic.com / CisoPass123!');
  console.log('  Admin:   admin@sabic.com / AdminPass123!');
  console.log('  Analyst: analyst@sabic.com / AnalystPass123!');
  console.log('  Viewer:  viewer@sabic.com / ViewerPass123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
