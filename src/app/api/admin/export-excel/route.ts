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
    const status = searchParams.get('status') || 'ALL';
    const query = searchParams.get('q') || '';

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
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const cleanStr = String(str).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const headers = [
      'Application ID',
      'Candidate Name',
      'Candidate Name (Nepali)',
      'Email',
      'Contact Number',
      'Gender',
      'Citizenship No',
      'District',
      'Application Status',
      'Applied Date'
    ];

    const rows = applications.map((app) => [
      escapeCsv(app.appNo),
      escapeCsv(app.applicantNameEn || app.user?.name),
      escapeCsv(app.applicantNameNp),
      escapeCsv(app.permEmail || app.user?.email),
      escapeCsv(app.permPhone || app.tempPhone || 'N/A'),
      escapeCsv(app.gender),
      escapeCsv(app.citizenshipNo),
      escapeCsv(app.permDistrict),
      escapeCsv(app.status),
      escapeCsv(new Date(app.createdAt).toLocaleDateString('en-US'))
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel formats Nepalese text & characters correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `BKMCH_Candidates_Report_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Export candidates Excel error:', error);
    return NextResponse.json({ error: 'Failed to export candidates data' }, { status: 500 });
  }
}
