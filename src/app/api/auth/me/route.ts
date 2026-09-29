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
    const response = NextResponse.json({
      user: null,
      accountDeleted: true,
      message: 'Your account has been deleted by the administrator.'
    });
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.json({ user: dbUser });
}
