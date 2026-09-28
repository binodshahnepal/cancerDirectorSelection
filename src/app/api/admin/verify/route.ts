import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { applicationId, status, remarks } = await request.json();

    if (!applicationId || !['APPROVED', 'REJECTED', 'SUBMITTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        remarks: remarks || '',
        verifiedBy: session.name || session.email,
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    console.error('Verify application error:', error);
    return NextResponse.json({ error: 'Failed to verify application' }, { status: 500 });
  }
}
