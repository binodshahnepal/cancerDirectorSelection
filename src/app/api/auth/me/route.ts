import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  if (!dbUser) {
    let deleted = null;
    try {
      if (session.email) {
        deleted = await prisma.deletedAccount.findUnique({
          where: { email: session.email }
        });
      }
    } catch (e) {
      // Table fallback
    }

    const response = NextResponse.json({
      user: null,
      accountDeleted: !!deleted,
      message: deleted ? 'Your account has been deleted by the administrator.' : 'Session expired'
    });
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.json({ user: dbUser });
}
