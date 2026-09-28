import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let application = await prisma.application.findFirst({
      where: { userId: session.userId },
      include: {
        qualifications: true,
        experiences: true,
        trainings: true,
        documents: true
      }
    });

    if (!application) {
      // Auto-create initial draft application for applicant
      const count = await prisma.application.count();
      const appNo = `BKMCH-${2026001 + count}`;
      application = await prisma.application.create({
        data: {
          userId: session.userId,
          appNo,
          status: 'DRAFT',
          permEmail: session.email
        },
        include: {
          qualifications: true,
          experiences: true,
          trainings: true,
          documents: true
        }
      });
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error('Fetch application error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      applicantNameNp,
      applicantNameEn,
      dob,
      age,
      gender,
      citizenshipNo,
      citizenshipDistrict,
      citizenshipDate,
      fatherName,
      motherName,
      grandfatherName,
      spouseName,
      permProvince,
      permDistrict,
      permLocalBody,
      permWard,
      permTole,
      permPhone,
      permEmail,
      tempProvince,
      tempDistrict,
      tempLocalBody,
      tempWard,
      tempTole,
      tempPhone,
      awards,
      publications,
      otherDetails,
      declarationAccepted,
      qualifications,
      experiences,
      trainings
    } = body;

    // Delete existing child relations before inserting updated ones
    if (id) {
      await prisma.qualification.deleteMany({ where: { applicationId: id } });
      await prisma.experience.deleteMany({ where: { applicationId: id } });
      await prisma.training.deleteMany({ where: { applicationId: id } });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: status || 'DRAFT',
        applicantNameNp,
        applicantNameEn,
        dob,
        age,
        gender,
        citizenshipNo,
        citizenshipDistrict,
        citizenshipDate,
        fatherName,
        motherName,
        grandfatherName,
        spouseName,
        permProvince,
        permDistrict,
        permLocalBody,
        permWard,
        permTole,
        permPhone,
        permEmail,
        tempProvince,
        tempDistrict,
        tempLocalBody,
        tempWard,
        tempTole,
        tempPhone,
        awards,
        publications,
        otherDetails,
        declarationAccepted: Boolean(declarationAccepted),
        qualifications: {
          create: (qualifications || []).map((q: any) => ({
            degree: q.degree || '',
            subject: q.subject || '',
            university: q.university || '',
            passedYear: q.passedYear || '',
            divisionGpa: q.divisionGpa || ''
          }))
        },
        experiences: {
          create: (experiences || []).map((e: any) => ({
            organization: e.organization || '',
            designation: e.designation || '',
            periodFrom: e.periodFrom || '',
            periodTo: e.periodTo || '',
            responsibilities: e.responsibilities || ''
          }))
        },
        trainings: {
          create: (trainings || []).map((t: any) => ({
            title: t.title || '',
            institution: t.institution || '',
            duration: t.duration || '',
            yearObtained: t.yearObtained || ''
          }))
        }
      },
      include: {
        qualifications: true,
        experiences: true,
        trainings: true,
        documents: true
      }
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    console.error('Save application error:', error);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }
}
