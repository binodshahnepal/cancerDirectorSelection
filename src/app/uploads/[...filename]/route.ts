import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain'
};

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string[] }> | { filename: string[] } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const rawFilename = params?.filename;
    
    if (!rawFilename || (Array.isArray(rawFilename) && rawFilename.length === 0)) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const filenameStr = Array.isArray(rawFilename) ? rawFilename.join('/') : rawFilename;
    const sanitizedPath = path.normalize(filenameStr).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(process.cwd(), 'public', 'uploads', sanitizedPath);

    try {
      await stat(filePath);
    } catch {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = path.extname(sanitizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isInline = contentType.startsWith('image/') || contentType === 'application/pdf';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': isInline ? 'inline' : `attachment; filename="${path.basename(sanitizedPath)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error('Serving uploaded file error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
