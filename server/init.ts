import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { nanoid } from 'nanoid';
import { db } from './db';
import { users, sites, prospects, contentItems, siteViews, templates } from '@shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Check if database is initialized with retry logic
async function isDatabaseInitialized(): Promise<boolean> {
  let retries = 5;
  
  while (retries > 0) {
    try {
      const userCount = await db.select().from(users).limit(1);
      return userCount.length > 0;
    } catch (error: any) {
      if (error.code === '3D000') { // Database does not exist
        console.log(`Database not ready yet, waiting... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      } else if (error.code === '42P01') { // Table does not exist
        console.log('Database tables not created yet');
        return false;
      } else {
        console.log('Database check error:', error.message);
        return false;
      }
    }
  }
  
  return false;
}

// Initialize test users
async function initializeTestUsers() {
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
    }
  ];

  console.log('🔧 Creating test users...');
  
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
    
    console.log(`  ✓ Created: ${user.email} (${user.role})`);
  }
}

// Initialize templates
async function initializeTemplates() {
  const defaultTemplates = [
    {
      name: "Professional Services",
      description: "Clean, modern template for professional services",
      category: "Business",
      content: {
        sections: [
          {
            id: "hero",
            type: "hero",
            content: {
              title: "Welcome {{prospect_name}}",
              subtitle: "Your Custom Solution Portal",
              backgroundImage: "/api/placeholder/1200/400"
            }
          },
          {
            id: "overview",
            type: "text",
            content: {
              title: "Overview",
              body: "This portal has been created specifically for {{prospect_company}} to provide you with all the resources and information about our proposed solution."
            }
          }
        ]
      }
    },
    {
      name: "Manufacturing Solution",
      description: "Industrial manufacturing focused template",
      category: "Manufacturing",
      content: {
        sections: [
          {
            id: "hero",
            type: "hero",
            content: {
              title: "Infor CloudSuite Industrial",
              subtitle: "Tailored for {{prospect_company}}",
              backgroundImage: "/api/placeholder/1200/400"
            }
          },
          {
            id: "benefits",
            type: "features",
            content: {
              title: "Key Benefits",
              items: [
                "Streamlined Operations",
                "Real-time Visibility",
                "Cost Reduction",
                "Improved Efficiency"
              ]
            }
          }
        ]
      }
    },
    {
      name: "Quick Start",
      description: "Simple, fast template for quick deployments",
      category: "Basic",
      content: {
        sections: [
          {
            id: "welcome",
            type: "hero",
            content: {
              title: "Welcome to Your Portal",
              subtitle: "{{prospect_name}} - {{prospect_company}}"
            }
          }
        ]
      }
    }
  ];

  console.log('📄 Creating default templates...');
  
  for (const template of defaultTemplates) {
    await db.insert(templates).values(template);
    console.log(`  ✓ Created template: ${template.name}`);
  }
}

// Initialize sample data
async function initializeSampleData() {
  // Get first admin user
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (!adminUser) return;

  // Get first template
  const [template] = await db.select().from(templates).limit(1);
  if (!template) return;

  console.log('📊 Creating sample data...');

  // Create sample prospects
  const sampleProspects = [
    {
      id: nanoid(),
      userId: adminUser.id,
      name: 'Alex Carter',
      email: 'alex.carter@acmecorp.com',
      company: 'Acme Corporation',
      phone: '+1 (555) 123-4567',
      notes: 'Interested in manufacturing module'
    },
    {
      id: nanoid(),
      userId: adminUser.id,
      name: 'Morgan Lee',
      email: 'morgan.lee@techstart.io',
      company: 'TechStart Inc',
      phone: '+1 (555) 987-6543',
      notes: 'Evaluating cloud migration options'
    }
  ];

  for (const prospect of sampleProspects) {
    await db.insert(prospects).values(prospect);
  }

  // Create sample site
  const siteId = crypto.randomUUID();
  const accessCode = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  await db.insert(sites).values({
    id: siteId,
    name: 'Acme Onboarding Portal',
    userId: adminUser.id,
    templateId: template.id,
    prospectName: 'Alex Carter',
    prospectEmail: 'alex.carter@acmecorp.com',
    prospectCompany: 'Acme Corporation',
    accessCode: accessCode,
    welcomeMessage: 'Welcome to your personalized Infor CloudSuite Industrial portal!',
    isActive: true,
    createdBy: adminUser.id
  });

  console.log(`  ✓ Created sample site with access code: ${accessCode}`);

  // Create sample content items
  const contentTypes = [
    { name: 'Product Brochure.pdf', type: 'document', fileUrl: '/uploads/sample-brochure.pdf' },
    { name: 'Implementation Timeline.xlsx', type: 'document', fileUrl: '/uploads/sample-timeline.xlsx' },
    { name: 'Solution Overview.pptx', type: 'presentation', fileUrl: '/uploads/sample-presentation.pptx' }
  ];

  for (const content of contentTypes) {
    await db.insert(contentItems).values({
      userId: adminUser.id,
      name: content.name,
      type: content.type,
      fileUrl: content.fileUrl,
      fileSize: Math.floor(Math.random() * 5000000) + 100000
    });
  }

  // Add sample views
  for (let i = 0; i < 5; i++) {
    await db.insert(siteViews).values({
      siteId: siteId,
      ipAddress: `192.168.1.${100 + i}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    });
  }

  console.log('  ✓ Sample data created successfully');
}

// Main initialization function
export async function initializeDatabase() {
  try {
    const isInitialized = await isDatabaseInitialized();
    
    if (!isInitialized) {
      console.log('\n🚀 INITIALIZING DATABASE - FIRST RUN SETUP\n');
      console.log('=====================================\n');
      
      // Run all initializations
      await initializeTestUsers();
      await initializeTemplates();
      await initializeSampleData();
      
      console.log('\n=====================================');
      console.log('✅ DATABASE INITIALIZATION COMPLETE!\n');
      console.log('📝 Test User Credentials:');
      console.log('  • admin@godlan.com / Admin123! (Admin)');
      console.log('  • manager@godlan.com / Manager123! (Admin)');
      console.log('  • john.smith@godlan.com / User123! (User)\n');
      console.log('=====================================\n');
    } else {
      console.log('✓ Database already initialized');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('Continuing with server startup...');
  }
}