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
    const role = searchParams.get('role') || '';

    const where: any = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { email: { contains: query } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        applications: {
          select: {
            id: true,
            appNo: true,
            status: true,
            applicantNameEn: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userStats = {
      totalUsers: await prisma.user.count(),
      totalApplicants: await prisma.user.count({ where: { role: 'APPLICANT' } }),
      totalAdmins: await prisma.user.count({ where: { role: 'ADMIN' } })
    };

    return NextResponse.json({ users, stats: userStats });
  } catch (error: any) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Protect against self-deletion
    if (id === session.userId) {
      return NextResponse.json({ error: 'You cannot delete your own admin account!' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log to DeletedAccount if applicant
    if (user.email) {
      try {
        await prisma.deletedAccount.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name,
            reason: 'Account deleted by Administrator'
          },
          update: {
            deletedAt: new Date()
          }
        });
      } catch (logErr) {
        console.error('Failed to log deleted account:', logErr);
      }
    }

    // Delete user applications and child relations
    const userApps = await prisma.application.findMany({
      where: { userId: id },
      select: { id: true }
    });

    const appIds = userApps.map(a => a.id);
    if (appIds.length > 0) {
      await prisma.qualification.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.experience.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.training.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.document.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.application.deleteMany({ where: { id: { in: appIds } } });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'User account and related data deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
