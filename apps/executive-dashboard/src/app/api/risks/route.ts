import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@aegisciso/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      source,
      inherentLikelihood,
      inherentImpact,
      treatmentPlan,
    } = body;

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

    const risk = await prisma.risk.create({
      data: {
        code,
        title,
        description,
        category,
        source,
        inherentLikelihood,
        inherentImpact,
        inherentRiskScore: inherentLikelihood * inherentImpact,
        status: 'IDENTIFIED',
        treatmentPlan,
        treatmentStatus: treatmentPlan ? 'IN_PROGRESS' : 'NOT_STARTED',
        priority: inherentLikelihood * inherentImpact >= 20 ? 1 : inherentLikelihood * inherentImpact >= 12 ? 2 : 3,
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
