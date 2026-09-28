import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { applicantNameNp: { contains: query } },
        { applicantNameEn: { contains: query } },
        { citizenshipNo: { contains: query } },
        { permDistrict: { contains: query } },
        { appNo: { contains: query } },
        { user: { email: { contains: query } } }
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        qualifications: true,
        experiences: true,
        trainings: true,
        documents: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const stats = {
      total: await prisma.application.count(),
      pending: await prisma.application.count({ where: { status: 'SUBMITTED' } }),
      approved: await prisma.application.count({ where: { status: 'APPROVED' } }),
      rejected: await prisma.application.count({ where: { status: 'REJECTED' } }),
      drafts: await prisma.application.count({ where: { status: 'DRAFT' } })
    };

    return NextResponse.json({ applications, stats });
  } catch (error: any) {
    console.error('Fetch admin applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
