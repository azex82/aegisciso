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
      priority,
      fiscalYear,
      quarter,
      targetDate,
    } = body;

    // Generate a unique code
    const lastObjective = await prisma.strategyObjective.findFirst({
      orderBy: { code: 'desc' },
    });
    const nextNumber = lastObjective
      ? parseInt(lastObjective.code.replace('OBJ-', '')) + 1
      : 1;
    const code = `OBJ-${String(nextNumber).padStart(3, '0')}`;

    // Get the user's ID from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const objective = await prisma.strategyObjective.create({
      data: {
        code,
        title,
        description,
        category,
        priority,
        status: 'NOT_STARTED',
        progressPercent: 0,
        fiscalYear,
        quarter,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        ownerId: user?.id,
      },
    });

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    console.error('Error creating objective:', error);
    return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const objectives = await prisma.strategyObjective.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true } },
      },
    });

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('Error fetching objectives:', error);
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
  }
}
