import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const app = await prisma.application.findFirst({
      where: { OR: [{ id }, { appNo: id }] },
      include: {
        user: true,
        qualifications: true,
        experiences: true,
        trainings: true,
        documents: true
      }
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page 1: Application Summary Sheet (A4 size: 595.28 x 841.89)
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Primary Colors
    const primaryColor = rgb(0.08, 0.25, 0.45); // Deep Blue
    const darkColor = rgb(0.1, 0.1, 0.1);
    const lightBg = rgb(0.95, 0.96, 0.98);

    let y = height - 40;

    // Header Title Banner
    page.drawRectangle({
      x: 30,
      y: y - 50,
      width: width - 60,
      height: 50,
      color: primaryColor
    });

    page.drawText('B.P. KOIRALA MEMORIAL CANCER HOSPITAL', {
      x: 45,
      y: y - 20,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('RECRUITMENT PORTAL - EXECUTIVE DIRECTOR SELECTION', {
      x: 45,
      y: y - 36,
      size: 9,
      font: fontRegular,
      color: rgb(0.85, 0.9, 1)
    });

    y -= 70;

    // Metadata Bar
    page.drawRectangle({
      x: 30,
      y: y - 25,
      width: width - 60,
      height: 25,
      color: lightBg
    });

    page.drawText(`App Registration No: ${app.appNo}`, {
      x: 40,
      y: y - 17,
      size: 9,
      font: fontBold,
      color: darkColor
    });

    page.drawText(`Date: ${new Date(app.createdAt).toLocaleDateString()}`, {
      x: 250,
      y: y - 17,
      size: 9,
      font: fontRegular,
      color: darkColor
    });

    page.drawText(`Status: [ ${app.status} ]`, {
      x: 430,
      y: y - 17,
      size: 9,
      font: fontBold,
      color: app.status === 'APPROVED' ? rgb(0.1, 0.6, 0.2) : app.status === 'REJECTED' ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.3, 0.7)
    });

    y -= 40;

    const drawSectionHeader = (title: string) => {
      page.drawRectangle({
        x: 30,
        y: y - 18,
        width: width - 60,
        height: 18,
        color: rgb(0.9, 0.93, 0.97)
      });
      page.drawText(title, {
        x: 35,
        y: y - 13,
        size: 9,
        font: fontBold,
        color: primaryColor
      });
      y -= 25;
    };

    // 1. Personal Information
    drawSectionHeader('1. PERSONAL INFORMATION');

    const personalDetails = [
      `Full Name: ${app.applicantNameEn || app.user?.name || 'N/A'}`,
      `Date of Birth: ${app.dob || 'N/A'} (Age: ${app.age || 'N/A'})`,
      `Gender: ${app.gender || 'N/A'}`,
      `Citizenship No: ${app.citizenshipNo || 'N/A'} (Issue: ${app.citizenshipDistrict || 'N/A'})`,
      `Father's Name: ${app.fatherName || 'N/A'}`,
      `Mother's Name: ${app.motherName || 'N/A'}`,
      `Grandfather's Name: ${app.grandfatherName || 'N/A'}`,
      `Spouse's Name: ${app.spouseName || 'None'}`
    ];

    for (let i = 0; i < personalDetails.length; i += 2) {
      const col1 = personalDetails[i] || '';
      const col2 = personalDetails[i + 1] || '';
      page.drawText(col1.substring(0, 48), { x: 35, y: y - 10, size: 8, font: fontRegular, color: darkColor });
      if (col2) {
        page.drawText(col2.substring(0, 48), { x: 300, y: y - 10, size: 8, font: fontRegular, color: darkColor });
      }
      y -= 14;
    }

    y -= 10;

    // 2. Address Details
    drawSectionHeader('2. PERMANENT & CURRENT LOCATION');

    const addressDetails = [
      `Permanent Location: ${app.permLocalBody || ''}, Ward #${app.permWard || ''}, ${app.permDistrict || ''}, ${app.permProvince || ''}`,
      `Tole / Street: ${app.permTole || 'N/A'} | Contact Phone: ${app.permPhone || 'N/A'}`,
      `Email Address: ${app.permEmail || app.user?.email || 'N/A'}`,
      `Current Location: ${app.tempLocalBody ? `${app.tempLocalBody}, ${app.tempDistrict || ''}` : 'Same as Permanent'}`
    ];

    for (const item of addressDetails) {
      page.drawText(item.substring(0, 95), { x: 35, y: y - 10, size: 8, font: fontRegular, color: darkColor });
      y -= 14;
    }

    y -= 10;

    // 3. Academic Qualifications
    drawSectionHeader('3. ACADEMIC QUALIFICATIONS');

    if ((app.qualifications || []).length === 0) {
      page.drawText('No academic qualifications recorded.', { x: 35, y: y - 10, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      y -= 14;
    } else {
      page.drawText('Degree', { x: 35, y: y - 10, size: 8, font: fontBold, color: darkColor });
      page.drawText('Major Subject', { x: 140, y: y - 10, size: 8, font: fontBold, color: darkColor });
      page.drawText('University / Board', { x: 260, y: y - 10, size: 8, font: fontBold, color: darkColor });
      page.drawText('Year', { x: 420, y: y - 10, size: 8, font: fontBold, color: darkColor });
      page.drawText('GPA / %', { x: 480, y: y - 10, size: 8, font: fontBold, color: darkColor });
      y -= 14;

      for (const q of app.qualifications) {
        page.drawText((q.degree || '').substring(0, 18), { x: 35, y: y - 10, size: 8, font: fontRegular, color: darkColor });
        page.drawText((q.subject || '').substring(0, 20), { x: 140, y: y - 10, size: 8, font: fontRegular, color: darkColor });
        page.drawText((q.university || '').substring(0, 25), { x: 260, y: y - 10, size: 8, font: fontRegular, color: darkColor });
        page.drawText((q.passedYear || '').substring(0, 8), { x: 420, y: y - 10, size: 8, font: fontRegular, color: darkColor });
        page.drawText((q.divisionGpa || '').substring(0, 10), { x: 480, y: y - 10, size: 8, font: fontRegular, color: darkColor });
        y -= 14;
      }
    }

    y -= 10;

    // 4. Work Experience
    drawSectionHeader('4. WORK EXPERIENCE ENTRIES');

    if ((app.experiences || []).length === 0) {
      page.drawText('No work experience entries recorded.', { x: 35, y: y - 10, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      y -= 14;
    } else {
      for (const exp of app.experiences) {
        page.drawText(`${exp.organization} - ${exp.designation} (${exp.periodFrom} to ${exp.periodTo || 'Present'})`, {
          x: 35,
          y: y - 10,
          size: 8,
          font: fontBold,
          color: darkColor
        });
        y -= 12;
        if (exp.responsibilities) {
          const respText = exp.responsibilities.replace(/\n/g, ' ').substring(0, 110);
          page.drawText(respText, { x: 45, y: y - 10, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
          y -= 12;
        }
      }
    }

    y -= 10;

    // 5. Verification Panel
    drawSectionHeader('5. OFFICIAL VERIFICATION & AUDIT RECORD');

    page.drawText(`Verification Status: ${app.status}`, { x: 35, y: y - 10, size: 8, font: fontBold, color: darkColor });
    page.drawText(`Verified By: ${app.verifiedBy || 'Pending Admin Review'}`, { x: 250, y: y - 10, size: 8, font: fontRegular, color: darkColor });
    y -= 14;
    page.drawText(`Verification Date: ${app.verifiedAt ? new Date(app.verifiedAt).toLocaleString() : 'N/A'}`, { x: 35, y: y - 10, size: 8, font: fontRegular, color: darkColor });
    page.drawText(`Remarks: ${app.remarks || 'None'}`, { x: 250, y: y - 10, size: 8, font: fontRegular, color: darkColor });
    y -= 25;

    // Attached Documents Overview Note
    page.drawText(`Attached Verification Files Total: ${(app.documents || []).length} Document(s)`, {
      x: 35,
      y: y - 10,
      size: 9,
      font: fontBold,
      color: primaryColor
    });
    page.drawText('All attached document pages and scanned copies are appended sequentially below.', {
      x: 35,
      y: y - 22,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4)
    });

    // APPEND ALL UPLOADED ATTACHED DOCUMENTS
    for (let index = 0; index < (app.documents || []).length; index++) {
      const doc = app.documents[index];
      if (!doc.filePath) continue;

      const diskPath = path.join(process.cwd(), 'public', doc.filePath.replace(/^\//, ''));

      try {
        const fileBuffer = await readFile(diskPath);
        const fileNameLower = (doc.fileName || '').toLowerCase();
        const mimeLower = (doc.mimeType || '').toLowerCase();

        if (fileNameLower.endsWith('.pdf') || mimeLower.includes('pdf')) {
          // It's a PDF document!
          const srcPdf = await PDFDocument.load(fileBuffer);
          const copiedPages = await pdfDoc.copyPages(srcPdf, srcPdf.getPageIndices());

          for (let pIdx = 0; pIdx < copiedPages.length; pIdx++) {
            const copyPage = copiedPages[pIdx];
            const pSize = copyPage.getSize();
            copyPage.drawRectangle({
              x: 0,
              y: pSize.height - 20,
              width: pSize.width,
              height: 20,
              color: primaryColor
            });
            copyPage.drawText(`Attached Document #${index + 1}: ${doc.title || doc.fileName} (Page ${pIdx + 1}/${copiedPages.length})`, {
              x: 15,
              y: pSize.height - 14,
              size: 8,
              font: fontBold,
              color: rgb(1, 1, 1)
            });
            pdfDoc.addPage(copyPage);
          }
        } else if (
          fileNameLower.endsWith('.jpg') ||
          fileNameLower.endsWith('.jpeg') ||
          fileNameLower.endsWith('.png') ||
          fileNameLower.endsWith('.webp') ||
          mimeLower.includes('image')
        ) {
          // It's an Image file!
          let imageEmbed;
          if (fileNameLower.endsWith('.png') || mimeLower.includes('png')) {
            imageEmbed = await pdfDoc.embedPng(fileBuffer);
          } else {
            imageEmbed = await pdfDoc.embedJpg(fileBuffer);
          }

          const imgPage = pdfDoc.addPage([595.28, 841.89]);
          const { width: pW, height: pH } = imgPage.getSize();

          // Header Banner
          imgPage.drawRectangle({
            x: 0,
            y: pH - 30,
            width: pW,
            height: 30,
            color: primaryColor
          });

          imgPage.drawText(`Attached Document #${index + 1}: ${doc.title || doc.fileName}`, {
            x: 20,
            y: pH - 20,
            size: 9,
            font: fontBold,
            color: rgb(1, 1, 1)
          });

          // Scale Image to fit A4 page
          const maxW = pW - 40;
          const maxH = pH - 60;
          const imgDims = imageEmbed.scaleToFit(maxW, maxH);

          const imgX = (pW - imgDims.width) / 2;
          const imgY = (pH - 30 - imgDims.height) / 2;

          imgPage.drawImage(imageEmbed, {
            x: imgX,
            y: imgY,
            width: imgDims.width,
            height: imgDims.height
          });
        }
      } catch (err) {
        console.warn(`Could not append document ${doc.fileName} to merged PDF:`, err);
      }
    }

    const mergedPdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(mergedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="BKMCH_Application_${app.appNo}_Merged.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Merge PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate merged PDF' }, { status: 500 });
  }
}
