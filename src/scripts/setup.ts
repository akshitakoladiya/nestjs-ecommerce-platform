import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/services/user.service';
import { UserRole } from '../common/constants/roles';
import * as fs from 'fs';
import * as path from 'path';

const SETUP_FLAG_FILE = path.join(__dirname, '../.setup-complete');

async function runSetup() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  if (fs.existsSync(SETUP_FLAG_FILE)) {
    console.log('✅ Setup already completed. Skipping...');
    await app.close();
    return;
  }

  const defaultUsers = [
    {
      email: 'admin@admin.com',
      password: 'admin@123',
      firstName: 'Admin',
      lastName: 'User',
      mobileNo: '+919876543210',
      gender: 'male',
      roles: [UserRole.ADMIN],
    },
    {
      email: 'manager@admin.com',
      password: 'manager@123',
      firstName: 'Manager',
      lastName: 'User',
      mobileNo: '+919876543211',
      gender: 'male',
      roles: [UserRole.MANAGER],
    },
  ];

  try {
    console.log('🚀 Starting initial setup...');
    console.log('📝 Creating default users...');

    for (const userData of defaultUsers) {
      try {
        const existingUser = await userService.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        const newUser = await userService.createUser(userData);
        console.log(`✅ Created ${userData.roles[0]} user: ${newUser.email}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    fs.writeFileSync(SETUP_FLAG_FILE, JSON.stringify({ completedAt: new Date().toISOString() }));

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Default Users Created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@admin.com | Password: admin@123 | Role: ADMIN');
    console.log('Email: manager@admin.com | Password: manager@123 | Role: MANAGER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Change these passwords in production!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSetup();
