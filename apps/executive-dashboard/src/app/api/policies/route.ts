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
      frameworkSource,
      maturityLevel,
    } = body;

    // Generate a unique code
    const lastPolicy = await prisma.policy.findFirst({
      orderBy: { code: 'desc' },
    });
    const nextNumber = lastPolicy
      ? parseInt(lastPolicy.code.split('-').pop() || '0') + 1
      : 1;
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const code = `POL-${categoryPrefix}-${String(nextNumber).padStart(3, '0')}`;

    // Get the user's ID from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const policy = await prisma.policy.create({
      data: {
        code,
        title,
        description,
        category,
        frameworkSource,
        maturityLevel,
        status: 'DRAFT',
        version: '1.0',
        ownerId: user?.id,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true } },
      },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}
