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

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application or User ID is required' }, { status: 400 });
    }

    // Try finding application by application ID first, then by userId
    let app = await prisma.application.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!app) {
      app = await prisma.application.findFirst({
        where: { userId: id },
        include: { user: true }
      });
    }

    let userId: string | null = null;
    let email: string | null = null;
    let appNo: string | null = null;
    let name: string | null = null;

    if (app) {
      userId = app.userId;
      email = app.user?.email || null;
      appNo = app.appNo;
      name = app.applicantNameEn || app.user?.name || null;
    } else {
      // Try to find user directly
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        userId = user.id;
        email = user.email;
        name = user.name;
      }
    }

    if (!app && !userId) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Log to DeletedAccount if we have an email
    if (email) {
      try {
        await prisma.deletedAccount.upsert({
          where: { email },
          create: {
            email,
            appNo: appNo || 'N/A',
            name: name || 'Applicant',
            reason: 'Deleted by Administrator'
          },
          update: {
            deletedAt: new Date()
          }
        });
      } catch (logErr) {
        console.error('Failed to log deleted account:', logErr);
      }
    }

    // Perform sequential deletion of relational data if userId exists
    if (userId) {
      const userApps = await prisma.application.findMany({
        where: { userId },
        select: { id: true }
      });

      const appIds = userApps.map(a => a.id);
      if (app?.id && !appIds.includes(app.id)) {
        appIds.push(app.id);
      }

      if (appIds.length > 0) {
        await prisma.qualification.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.experience.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.training.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.document.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.application.deleteMany({ where: { id: { in: appIds } } });
      }

      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (userDelErr) {
        console.error('Failed to delete user record:', userDelErr);
      }
    } else if (app) {
      // Clean up application only if no userId
      await prisma.qualification.deleteMany({ where: { applicationId: app.id } });
      await prisma.experience.deleteMany({ where: { applicationId: app.id } });
      await prisma.training.deleteMany({ where: { applicationId: app.id } });
      await prisma.document.deleteMany({ where: { applicationId: app.id } });
      await prisma.application.delete({ where: { id: app.id } });
    }

    return NextResponse.json({ success: true, message: 'Application and user account deleted successfully' });
  } catch (error: any) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete application' }, { status: 500 });
  }
}

