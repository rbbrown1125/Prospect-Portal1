import { randomBytes, scryptSync } from "node:crypto";
import { db, pool } from "../server/db";
import {
  users,
  sites,
  prospects,
  siteViews,
  contentItems,
  templates,
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { uploadBufferToAirtable } from "../server/airtable";

interface SeedSummary {
  usersCreated: number;
  sitesCreated: number;
  prospectsCreated: number;
  viewsCreated: number;
  contentItemsCreated: number;
  airtableUploads: number;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${hashed}.${salt}`;
}

async function ensureSampleTemplates() {
  const existing = await db.select().from(templates).limit(1);
  if (existing.length === 0) {
    throw new Error(
      "No templates found. Run the application once or execute the template seeding routine before seeding sample data.",
    );
  }
}

async function seedSampleData(): Promise<SeedSummary> {
  await ensureSampleTemplates();

  const summary: SeedSummary = {
    usersCreated: 0,
    sitesCreated: 0,
    prospectsCreated: 0,
    viewsCreated: 0,
    contentItemsCreated: 0,
    airtableUploads: 0,
  };

  const sampleUserEmail = "jamie.sales@godlan.com";
  const samplePassword = "SamplePass123!";

  const [existingUser] = await db.select().from(users).where(eq(users.email, sampleUserEmail));

  let sampleUser = existingUser;
  if (!sampleUser) {
    const hashedPassword = await hashPassword(samplePassword);
    const firstName = "Jamie";
    const lastName = "Sales";

    let profileImageUrl: string | null = null;
    let profileAssetId: string | null = null;

    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      try {
        const pngPixel =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
        const uploadResult = await uploadBufferToAirtable(
          Buffer.from(pngPixel, "base64"),
          "jamie-sales-profile.png",
          "image/png",
          {
            DisplayName: `${firstName} ${lastName}`,
            AssetType: "profile-picture",
            SeedData: true,
          },
        );
        profileImageUrl = uploadResult.url;
        profileAssetId = uploadResult.recordId;
        summary.airtableUploads += 1;
      } catch (error) {
        console.warn("Failed to upload sample profile image to Airtable:", error);
      }
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        email: sampleUserEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
        company: "Godlan",
        title: "Director of Sales Enablement",
        location: "Detroit, MI",
        phone: "+1 (313) 555-0183",
        profileImageUrl,
        profileImageAssetId: profileAssetId,
      })
      .returning();

    sampleUser = createdUser;
    summary.usersCreated += 1;
  }

  if (!sampleUser) {
    throw new Error("Failed to create or retrieve the sample user");
  }

  const [firstTemplate] = await db.select().from(templates).limit(1);
  const sampleSiteName = "Acme Onboarding Portal";

  const [existingSite] = await db.select().from(sites).where(eq(sites.name, sampleSiteName));

  let sampleSite = existingSite;
  if (!sampleSite) {
    const [createdSite] = await db
      .insert(sites)
      .values({
        name: sampleSiteName,
        userId: sampleUser.id,
        createdBy: sampleUser.id,
        templateId: firstTemplate?.id,
        prospectName: "Alex Carter",
        prospectEmail: "alex.carter@example.com",
        prospectCompany: "Acme Industrial",
        welcomeMessage: "Welcome to your personalized onboarding experience!",
        accessCode: "ACME2025",
        customContent: {
          onboardingChecklist: [
            "Review kickoff agenda",
            "Complete security questionnaire",
            "Schedule implementation workshop",
          ],
          featuredAssets: [
            {
              name: "Acme Project Timeline.pdf",
              url: "https://example.com/assets/acme-timeline.pdf",
            },
            {
              name: "Integration Overview.mp4",
              url: "https://example.com/assets/integration-overview.mp4",
            },
          ],
        },
      })
      .returning();

    sampleSite = createdSite;
    summary.sitesCreated += 1;
  }

  if (!sampleSite) {
    throw new Error("Failed to create or retrieve the sample site");
  }

  const sampleProspects = [
    {
      email: "alex.carter@example.com",
      name: "Alex Carter",
      company: "Acme Industrial",
      status: "active",
      notes: "Primary executive sponsor. Interested in analytics capabilities.",
    },
    {
      email: "morgan.lee@example.com",
      name: "Morgan Lee",
      company: "Acme Industrial",
      status: "invited",
      notes: "Operations lead evaluating onboarding workflows.",
    },
  ];

  for (const prospect of sampleProspects) {
    const [existingProspect] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.email, prospect.email));

    if (!existingProspect) {
      await db.insert(prospects).values({
        email: prospect.email,
        name: prospect.name,
        company: prospect.company,
        status: prospect.status,
        notes: prospect.notes,
        userId: sampleUser.id,
        siteId: sampleSite.id,
      });
      summary.prospectsCreated += 1;
    }
  }

  await db.delete(siteViews).where(eq(siteViews.siteId, sampleSite.id));
  const now = Date.now();
  const viewSamples = Array.from({ length: 6 }).map((_, index) => ({
    siteId: sampleSite.id,
    viewedAt: new Date(now - index * 6 * 60 * 60 * 1000),
    ipAddress: `192.168.1.${10 + index}`,
    userAgent: index % 2 === 0 ? "Mozilla/5.0 (Macintosh)" : "Mozilla/5.0 (Windows)",
  }));

  if (viewSamples.length > 0) {
    await db.insert(siteViews).values(viewSamples);
    summary.viewsCreated += viewSamples.length;
  }

  await db.delete(contentItems).where(eq(contentItems.userId, sampleUser.id));
  const sampleContentItems = [
    {
      name: "Executive Summary.pdf",
      type: "document",
      fileUrl: "https://example.com/assets/executive-summary.pdf",
      fileSize: 524288,
    },
    {
      name: "ROI Calculator.xlsx",
      type: "spreadsheet",
      fileUrl: "https://example.com/assets/roi-calculator.xlsx",
      fileSize: 1048576,
    },
    {
      name: "Solution Walkthrough.mp4",
      type: "video",
      fileUrl: "https://example.com/assets/solution-walkthrough.mp4",
      fileSize: 73400320,
    },
  ];

  if (sampleContentItems.length > 0) {
    await db.insert(contentItems).values(
      sampleContentItems.map((item) => ({
        ...item,
        userId: sampleUser.id,
      })),
    );
    summary.contentItemsCreated += sampleContentItems.length;
  }

  return summary;
}

async function main() {
  try {
    const summary = await seedSampleData();
    console.log("Sample data ready:", summary);
  } catch (error) {
    console.error("Failed to seed sample data:", error);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

void main();
