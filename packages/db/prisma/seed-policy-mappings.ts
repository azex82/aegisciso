/**
 * Policy-to-Control Mappings Seed
 * Maps policy statements to framework controls
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting policy-to-control mappings seed...\n');

  // Get all policies with their statements
  const policies = await prisma.policy.findMany({
    include: {
      statements: true,
    },
  });

  console.log(`Found ${policies.length} policies.`);

  // Count total statements
  const totalStatements = policies.reduce((sum, p) => sum + p.statements.length, 0);
  console.log(`Total policy statements: ${totalStatements}`);

  // Get frameworks with controls
  const ncaFramework = await prisma.framework.findUnique({
    where: { code: 'NCA_ECC' },
    include: { controls: true },
  });

  const isoFramework = await prisma.framework.findUnique({
    where: { code: 'ISO_27001' },
    include: { controls: true },
  });

  if (!ncaFramework || !isoFramework) {
    console.error('Required frameworks not found!');
    return;
  }

  console.log(`NCA ECC: ${ncaFramework.controls.length} controls`);
  console.log(`ISO 27001: ${isoFramework.controls.length} controls\n`);

  // Mapping config - policy prefix to NCA control prefix
  const mappingConfig: Record<string, { ncaPrefix: string; isoCodes: string[] }> = {
    'POL-GOV': { ncaPrefix: '1-', isoCodes: ['A.5.1', 'A.5.2', 'A.5.3', 'A.5.4', 'A.5.35', 'A.5.36', 'A.5.37'] },
    'POL-IAM': { ncaPrefix: '2-2-', isoCodes: ['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3', 'A.8.5'] },
    'POL-NET': { ncaPrefix: '2-3-', isoCodes: ['A.8.20', 'A.8.21', 'A.8.22'] },
    'POL-DPR': { ncaPrefix: '2-4-', isoCodes: ['A.5.12', 'A.5.13', 'A.5.14', 'A.8.10', 'A.8.11', 'A.8.12', 'A.8.13'] },
    'POL-VUL': { ncaPrefix: '3-2-', isoCodes: ['A.8.8'] },
    'POL-INC': { ncaPrefix: '3-3-', isoCodes: ['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.5.28'] },
    'POL-BCP': { ncaPrefix: '3-4-', isoCodes: ['A.5.29', 'A.5.30'] },
    'POL-TPM': { ncaPrefix: '4-1-', isoCodes: ['A.5.19', 'A.5.20', 'A.5.21', 'A.5.22'] },
    'POL-CLD': { ncaPrefix: '4-2-', isoCodes: ['A.5.23'] },
    'POL-AWR': { ncaPrefix: '1-6-', isoCodes: ['A.6.3'] },
  };

  let totalMappings = 0;
  console.log('Creating mappings...');

  for (const policy of policies) {
    const policyPrefix = policy.code.split('-').slice(0, 2).join('-');
    const config = mappingConfig[policyPrefix];

    if (!config) {
      console.log(`  ⚠ ${policy.code}: no mapping config`);
      continue;
    }

    if (policy.statements.length === 0) {
      console.log(`  ⚠ ${policy.code}: no statements`);
      continue;
    }

    let policyMappings = 0;

    // Get matching controls
    const ncaControls = ncaFramework.controls.filter(c => c.code.startsWith(config.ncaPrefix));
    const isoControls = isoFramework.controls.filter(c => config.isoCodes.includes(c.code));
    const allControls = [...ncaControls, ...isoControls];

    // Map each statement to appropriate controls (round-robin to distribute)
    for (let i = 0; i < policy.statements.length; i++) {
      const statement = policy.statements[i];

      // Map to a subset of controls (distribute evenly)
      const controlsPerStatement = Math.ceil(allControls.length / policy.statements.length);
      const startIdx = i * controlsPerStatement;
      const statementControls = allControls.slice(startIdx, startIdx + controlsPerStatement);

      for (const control of statementControls) {
        try {
          await prisma.mapping.create({
            data: {
              policyStatementId: statement.id,
              frameworkControlId: control.id,
              coverageLevel: 'FULL',
              mappingType: 'IMPLEMENTS',
              isVerified: true,
            },
          });
          policyMappings++;
          totalMappings++;
        } catch (e: any) {
          if (e.code === 'P2002') {
            // Already exists
            policyMappings++;
            totalMappings++;
          }
        }
      }
    }

    console.log(`  ✓ ${policy.code}: ${policyMappings} mappings (${policy.statements.length} statements → ${allControls.length} controls)`);
  }

  console.log(`\n========================================`);
  console.log(`Total mappings: ${totalMappings}`);
  console.log(`========================================\n`);

  // Coverage report
  console.log('Framework Coverage:');
  console.log('----------------------------------------');

  const frameworks = await prisma.framework.findMany({
    where: { isActive: true },
    include: { controls: { select: { id: true } } },
  });

  for (const fw of frameworks) {
    if (fw.controls.length === 0) continue;

    const controlIds = fw.controls.map(c => c.id);

    // Count distinct controls that have mappings
    const mappedControls = await prisma.mapping.groupBy({
      by: ['frameworkControlId'],
      where: { frameworkControlId: { in: controlIds } },
    });

    const coverage = Math.round((mappedControls.length / fw.controls.length) * 100);
    console.log(`${fw.code.padEnd(12)}: ${mappedControls.length}/${fw.controls.length} (${coverage}%)`);
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
