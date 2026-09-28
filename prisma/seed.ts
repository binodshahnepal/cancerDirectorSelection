import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Admin account...');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@bkmch.gov.np' }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'BKMCH System Administrator',
        email: 'admin@bkmch.gov.np',
        passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('Seeded Admin account created successfully!');
    console.log('Admin Email: admin@bkmch.gov.np');
    console.log('Admin Password: Admin@123456');
  } else {
    console.log('Admin account already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
