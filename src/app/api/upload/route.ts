import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const docType = (formData.get('docType') as string) || 'OTHER';
    const title = (formData.get('title') as string) || file.name;
    const applicationId = formData.get('applicationId') as string;

    if (!file || !applicationId) {
      return NextResponse.json({ error: 'File and Application ID are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || '.pdf';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;

    const doc = await prisma.document.create({
      data: {
        applicationId,
        docType,
        title,
        fileName: file.name,
        filePath: publicUrl,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream'
      }
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
