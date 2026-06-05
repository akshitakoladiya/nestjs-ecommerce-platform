import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/services/user.service';
import { UserRole } from '../common/constants/roles';

async function seedDefaultUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

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
    console.log('🌱 Seeding default users...');

    for (const user of defaultUsers) {
      const existingUser = await userService.findByEmail(user.email);
      if (existingUser) {
        console.log(`✅ User ${user.email} already exists, skipping...`);
        continue;
      }

      const newUser = await userService.createUser(user);
      console.log(`✅ Created user: ${newUser.email} with roles: ${newUser.roles.join(', ')}`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await app.close();
  }
}

seedDefaultUsers();
