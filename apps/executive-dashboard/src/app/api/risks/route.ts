import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@aegisciso/db';
import { z } from 'zod';

// Input validation schema
const createRiskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(100),
  source: z.string().min(1, 'Source is required').max(100),
  inherentLikelihood: z.number().int().min(1).max(5),
  inherentImpact: z.number().int().min(1).max(5),
  treatmentPlan: z.string().max(5000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = createRiskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      source,
      inherentLikelihood,
      inherentImpact,
      treatmentPlan,
    } = validationResult.data;

    // Generate a unique code
    const lastRisk = await prisma.risk.findFirst({
      orderBy: { code: 'desc' },
    });
    const nextNumber = lastRisk
      ? parseInt(lastRisk.code.replace('RSK-', '')) + 1
      : 1;
    const code = `RSK-${String(nextNumber).padStart(3, '0')}`;

    // Get the user's ID from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const riskScore = inherentLikelihood * inherentImpact;
    const risk = await prisma.risk.create({
      data: {
        code,
        title,
        description,
        category,
        source,
        inherentLikelihood,
        inherentImpact,
        inherentRiskScore: riskScore,
        status: 'IDENTIFIED',
        treatmentPlan,
        treatmentStatus: treatmentPlan ? 'IN_PROGRESS' : 'NOT_STARTED',
        priority: riskScore >= 20 ? 1 : riskScore >= 12 ? 2 : 3,
        ownerId: user?.id,
      },
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const risks = await prisma.risk.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true } },
      },
    });

    return NextResponse.json(risks);
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}
