import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { nanoid } from 'nanoid';
import { db, pool } from '../server/db';
import { users } from '../shared/schema';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createTestUsers() {
  const testUsers = [
    {
      email: 'admin@godlan.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      company: 'Godlan',
      title: 'System Administrator',
      location: 'Detroit, MI',
      phone: '+1 (313) 555-0100',
      role: 'admin'
    },
    {
      email: 'manager@godlan.com',
      password: 'Manager123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      company: 'Godlan',
      title: 'Sales Manager',
      location: 'Chicago, IL',
      phone: '+1 (312) 555-0200',
      role: 'admin'
    },
    {
      email: 'john.smith@godlan.com',
      password: 'User123!',
      firstName: 'John',
      lastName: 'Smith',
      company: 'Godlan',
      title: 'Sales Representative',
      location: 'New York, NY',
      phone: '+1 (212) 555-0300',
      role: 'user'
    },
    {
      email: 'emily.chen@godlan.com',
      password: 'User123!',
      firstName: 'Emily',
      lastName: 'Chen',
      company: 'Godlan',
      title: 'Account Executive',
      location: 'San Francisco, CA',
      phone: '+1 (415) 555-0400',
      role: 'user'
    },
    {
      email: 'mike.davis@godlan.com',
      password: 'User123!',
      firstName: 'Mike',
      lastName: 'Davis',
      company: 'Godlan',
      title: 'Business Development',
      location: 'Boston, MA',
      phone: '+1 (617) 555-0500',
      role: 'user'
    }
  ];

  try {
    console.log('Creating 5 test users...\n');
    
    for (const user of testUsers) {
      const hashedPassword = await hashPassword(user.password);
      
      await db.insert(users).values({
        id: nanoid(),
        email: user.email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        title: user.title,
        location: user.location,
        phone: user.phone,
        role: user.role as 'admin' | 'user',
        isActive: true
      });
      
      console.log(`✓ Created: ${user.email} (${user.role})`);
    }
    
    console.log('\n5 test users created successfully!\n');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('1. admin@godlan.com / Admin123! (Admin)');
    console.log('2. manager@godlan.com / Manager123! (Admin)');
    console.log('3. john.smith@godlan.com / User123! (User)');
    console.log('4. emily.chen@godlan.com / User123! (User)');
    console.log('5. mike.davis@godlan.com / User123! (User)');
    
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

void createTestUsers();
