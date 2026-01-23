/**
 * Sample Mappings Seed Data
 * Creates policy-to-control mappings to demonstrate compliance coverage
 */

import { PrismaClient, CoverageLevel, MappingType } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping definitions: policy statement code -> array of control mappings
// Each mapping specifies: framework code, control codes, coverage level
interface MappingDef {
  statementCode: string;
  mappings: Array<{
    framework: string;
    controls: string[];
    coverage: CoverageLevel;
    type?: MappingType;
  }>;
}

const mappingDefinitions: MappingDef[] = [
  // ============================================================================
  // Governance Policy (GOV-001) Mappings
  // ============================================================================
  {
    statementCode: 'GOV-001-01', // Cybersecurity governance committee
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.1', 'A.5.2', 'A.5.4'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['1-2-1', '1-2-2', '1-2-4'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.RR-01', 'GV.RR-02'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC1.1', 'CC1.2', 'CC1.3'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'GOV-001-02', // Executive leadership informed quarterly
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.4', 'A.5.35'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['1-9-2', '1-2-4'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.RM-01', 'GV.RR-03'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC2.2', 'CC4.1'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'GOV-001-03', // CISO appointment
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.2'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['1-2-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.RR-01', 'GV.RR-02'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC1.3', 'CC1.4'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Identity and Access Management Policy (IAM-001) Mappings
  // ============================================================================
  {
    statementCode: 'IAM-001-01', // Unique user identification
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.16', 'A.5.17', 'A.8.5'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-2-1', '2-2-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AA-01', 'PR.AA-02', 'PR.AA-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC6.1', 'CC6.2'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'IAM-001-02', // MFA for critical systems
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.5'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-2-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AA-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC6.1', 'CC6.6'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'IAM-001-03', // Access rights review
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.18'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-2-6'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AA-05'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC6.3', 'CC6.5'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'IAM-001-04', // Privileged access management
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.2', 'A.8.18'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-2-5'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AA-05'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC6.1', 'CC6.4'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Network Security Policy (NET-001) Mappings
  // ============================================================================
  {
    statementCode: 'NET-001-01', // Network segmentation
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.20', 'A.8.22'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-3-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.IR-01', 'PR.IR-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC6.6', 'CC6.7'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'NET-001-02', // Network traffic monitoring
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.15', 'A.8.16'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-1-1', '3-1-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['DE.CM-01', 'DE.AE-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.2', 'CC7.3'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'NET-001-03', // Firewall deny-by-default
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.20', 'A.8.21'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-3-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.IR-01'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC6.6'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Data Protection Policy (DPR-001) Mappings
  // ============================================================================
  {
    statementCode: 'DPR-001-01', // Data classification
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.12', 'A.5.13'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-4-1'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['ID.AM-05'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['C1.1'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'DPR-001-02', // Data encryption
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.24'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['2-4-2', '2-5-1'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.DS-01', 'PR.DS-02'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['C1.5', 'C1.10'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'DPR-001-03', // Data retention
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.33', 'A.8.10'], coverage: 'PARTIAL' },
      { framework: 'NCA_ECC', controls: ['2-4-5', '2-4-6'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.DS-06'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['C1.6', 'C1.7'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Vulnerability Management Policy (VUL-001) Mappings
  // ============================================================================
  {
    statementCode: 'VUL-001-01', // Monthly vulnerability assessments
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.8'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-2-1'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['ID.RA-01', 'DE.CM-08'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.1', 'CC4.1'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'VUL-001-02', // Critical vulnerability remediation
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.8', 'A.8.32'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-2-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RS.MI-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.4', 'CC7.5'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'VUL-001-03', // Annual penetration testing
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.8', 'A.5.35'], coverage: 'PARTIAL' },
      { framework: 'NCA_ECC', controls: ['3-2-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['ID.RA-01'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC4.1'], coverage: 'PARTIAL' },
    ],
  },

  // ============================================================================
  // Incident Response Policy (INC-001) Mappings
  // ============================================================================
  {
    statementCode: 'INC-001-01', // Incident response team
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.24', 'A.5.26'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-3-1', '3-3-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RS.MA-01', 'RS.CO-01'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.4'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'INC-001-02', // 1-hour incident reporting
    mappings: [
      { framework: 'ISO_27001', controls: ['A.6.8', 'A.5.25'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-3-3', '3-3-6'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RS.MA-02', 'RS.CO-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.3', 'CC7.4'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'INC-001-03', // Post-incident reviews
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.27'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-3-7'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RS.AN-03', 'ID.IM-01'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.5'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Business Continuity Policy (BCP-001) Mappings
  // ============================================================================
  {
    statementCode: 'BCP-001-01', // Annual BIA
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.29', 'A.5.30'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-4-1'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['ID.RA-04'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['A1.4'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'BCP-001-02', // Annual DR testing
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.30'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['3-4-2', '3-4-4'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RC.RP-01', 'ID.IM-04'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['A1.3', 'A1.5'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'BCP-001-03', // Recovery objectives
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.30'], coverage: 'PARTIAL' },
      { framework: 'NCA_ECC', controls: ['3-4-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['RC.RP-04'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['A1.4', 'A1.11'], coverage: 'PARTIAL' },
    ],
  },

  // ============================================================================
  // Third-Party Risk Management Policy (TPM-001) Mappings
  // ============================================================================
  {
    statementCode: 'TPM-001-01', // Vendor security assessments
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.19', 'A.5.20'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-1-1', '4-1-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.SC-01', 'ID.RA-10'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC9.2'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'TPM-001-02', // Contract security requirements
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.20'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-1-3', '4-1-4'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.SC-02'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC9.2'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'TPM-001-03', // Vendor access monitoring
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.22'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-1-5'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['DE.CM-06', 'GV.SC-03'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC6.4', 'CC7.2'], coverage: 'PARTIAL' },
    ],
  },

  // ============================================================================
  // Cloud Security Policy (CLD-001) Mappings
  // ============================================================================
  {
    statementCode: 'CLD-001-01', // Cloud provider assessment
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.23'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-2-1'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.SC-01'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC9.2'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'CLD-001-02', // Data sovereignty
    mappings: [
      { framework: 'ISO_27001', controls: ['A.5.31', 'A.5.34'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-2-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['GV.OC-03'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['C1.2', 'P4.1'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'CLD-001-03', // Cloud hardening
    mappings: [
      { framework: 'ISO_27001', controls: ['A.8.9'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['4-2-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.PS-01'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC7.1'], coverage: 'FULL' },
    ],
  },

  // ============================================================================
  // Security Awareness Policy (AWR-001) Mappings
  // ============================================================================
  {
    statementCode: 'AWR-001-01', // Annual security awareness training
    mappings: [
      { framework: 'ISO_27001', controls: ['A.6.3'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['1-6-1', '1-6-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AT-01'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC1.4', 'CC2.2'], coverage: 'FULL' },
    ],
  },
  {
    statementCode: 'AWR-001-02', // Quarterly phishing simulations
    mappings: [
      { framework: 'ISO_27001', controls: ['A.6.3'], coverage: 'PARTIAL' },
      { framework: 'NCA_ECC', controls: ['1-6-3'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AT-01'], coverage: 'PARTIAL' },
      { framework: 'SOC2', controls: ['CC2.2'], coverage: 'PARTIAL' },
    ],
  },
  {
    statementCode: 'AWR-001-03', // Role-specific training
    mappings: [
      { framework: 'ISO_27001', controls: ['A.6.3'], coverage: 'FULL' },
      { framework: 'NCA_ECC', controls: ['1-6-2'], coverage: 'FULL' },
      { framework: 'NIST_CSF', controls: ['PR.AT-02'], coverage: 'FULL' },
      { framework: 'SOC2', controls: ['CC1.4'], coverage: 'FULL' },
    ],
  },
];

async function main() {
  console.log('Starting mappings seed...\n');

  // Get all frameworks
  const frameworks = await prisma.framework.findMany();
  const frameworkMap = new Map(frameworks.map(f => [f.code, f.id]));

  // Get all policy statements
  const statements = await prisma.policyStatement.findMany();
  const statementMap = new Map(statements.map(s => [s.code, s.id]));

  // Get all framework controls
  const controls = await prisma.frameworkControl.findMany();
  const controlMap = new Map(controls.map(c => [`${c.frameworkId}:${c.code}`, c.id]));

  let totalMappings = 0;
  const stats = {
    ISO_27001: { full: 0, partial: 0 },
    NCA_ECC: { full: 0, partial: 0 },
    NIST_CSF: { full: 0, partial: 0 },
    SOC2: { full: 0, partial: 0 },
  };

  for (const def of mappingDefinitions) {
    const statementId = statementMap.get(def.statementCode);
    if (!statementId) {
      console.log(`  ⚠ Statement not found: ${def.statementCode}`);
      continue;
    }

    for (const mapping of def.mappings) {
      const frameworkId = frameworkMap.get(mapping.framework);
      if (!frameworkId) {
        console.log(`  ⚠ Framework not found: ${mapping.framework}`);
        continue;
      }

      for (const controlCode of mapping.controls) {
        const controlId = controlMap.get(`${frameworkId}:${controlCode}`);
        if (!controlId) {
          // Try without framework prefix for flexibility
          continue;
        }

        try {
          await prisma.mapping.upsert({
            where: {
              policyStatementId_frameworkControlId: {
                policyStatementId: statementId,
                frameworkControlId: controlId,
              },
            },
            update: {
              coverageLevel: mapping.coverage,
              mappingType: mapping.type || 'IMPLEMENTS',
              isVerified: true,
            },
            create: {
              policyStatementId: statementId,
              frameworkControlId: controlId,
              coverageLevel: mapping.coverage,
              mappingType: mapping.type || 'IMPLEMENTS',
              isVerified: true,
              confidence: mapping.coverage === 'FULL' ? 95 : 75,
            },
          });

          totalMappings++;
          if (mapping.coverage === 'FULL') {
            stats[mapping.framework as keyof typeof stats].full++;
          } else {
            stats[mapping.framework as keyof typeof stats].partial++;
          }
        } catch (e) {
          // Ignore duplicate errors
        }
      }
    }
  }

  console.log('========================================');
  console.log('Mappings Seed Summary:');
  console.log('========================================');
  console.log(`ISO 27001:2022    : ${stats.ISO_27001.full} full, ${stats.ISO_27001.partial} partial`);
  console.log(`NCA ECC           : ${stats.NCA_ECC.full} full, ${stats.NCA_ECC.partial} partial`);
  console.log(`NIST CSF 2.0      : ${stats.NIST_CSF.full} full, ${stats.NIST_CSF.partial} partial`);
  console.log(`SOC 2 Type II     : ${stats.SOC2.full} full, ${stats.SOC2.partial} partial`);
  console.log('----------------------------------------');
  console.log(`TOTAL MAPPINGS    : ${totalMappings}`);
  console.log('========================================\n');

  // Calculate and display expected coverage
  console.log('Expected Coverage (approximate):');
  const controlCounts = { ISO_27001: 93, NCA_ECC: 114, NIST_CSF: 108, SOC2: 89 };
  for (const [fw, counts] of Object.entries(stats)) {
    const total = controlCounts[fw as keyof typeof controlCounts];
    const coverage = Math.round(((counts.full + counts.partial * 0.5) / total) * 100);
    console.log(`  ${fw}: ~${coverage}% coverage`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
