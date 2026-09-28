import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
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

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { application: true }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && doc.application.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (doc.filePath) {
      const fullPath = path.join(process.cwd(), 'public', doc.filePath.replace(/^\//, ''));
      try {
        await unlink(fullPath);
      } catch (err) {
        console.warn('Could not delete file from disk:', err);
      }
    }

    await prisma.document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

