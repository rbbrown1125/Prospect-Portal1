import {
  users,
  sites,
  templates,
  contentItems,
  siteViews,
  prospects,
  files,
  activityLog,
  type User,
  type InsertUser,
  type Site,
  type InsertSite,
  type Template,
  type InsertTemplate,
  type ContentItem,
  type InsertContentItem,
  type InsertSiteView,
  type Prospect,
  type InsertProspect,
  type File,
  type InsertFile,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, ne, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<any>;
  
  // Site operations
  getUserSites(userId: string): Promise<Site[]>;
  getMySites(userId: string): Promise<Site[]>;
  getTeamSites(userId: string): Promise<any[]>;
  createSite(siteData: InsertSite): Promise<Site>;
  getSite(siteId: string, userId: string): Promise<Site | undefined>;
  updateSite(siteId: string, userId: string, updates: Partial<Site>): Promise<Site | undefined>;
  deleteSite(siteId: string, userId: string): Promise<boolean>;
  getPublicSite(siteId: string): Promise<Site | undefined>;
  authenticateProspectSite(siteId: string, password: string): Promise<Site | undefined>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  createTemplate(templateData: InsertTemplate): Promise<Template>;
  
  // Content operations
  getUserContent(userId: string): Promise<ContentItem[]>;
  createContentItem(contentData: InsertContentItem): Promise<ContentItem>;
  
  // Prospects operations
  getProspects(userId: string): Promise<Prospect[]>;
  createProspect(prospectData: InsertProspect): Promise<Prospect>;
  updateProspect(prospectId: string, userId: string, updates: Partial<Prospect>): Promise<Prospect | undefined>;
  deleteProspect(prospectId: string, userId: string): Promise<boolean>;
  
  // File operations
  getUserFiles(userId: string): Promise<File[]>;
  createFile(fileData: InsertFile): Promise<File>;
  deleteFile(fileId: string, userId: string): Promise<boolean>;
  
  // Analytics operations
  getSiteAnalytics(siteId: string, userId: string): Promise<any>;
  recordSiteView(viewData: InsertSiteView): Promise<void>;
  
  // Activity logging operations
  logActivity(activityData: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<any> {
    const userSites = await db.select().from(sites).where(eq(sites.userId, userId));
    const activeSites = userSites.filter(site => site.isActive).length;
    const totalViews = userSites.reduce((sum, site) => sum + (site.views || 0), 0);
    const activeProspects = new Set(userSites.map(site => site.prospectEmail)).size;
    
    return {
      activeSites,
      totalViews,
      activeProspects,
      engagementRate: userSites.length > 0 ? Math.round((totalViews / userSites.length) * 10) : 0,
    };
  }

  // Site operations
  async getUserSites(userId: string): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt));
  }

  async getMySites(userId: string): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt));
  }

  async getTeamSites(userId: string): Promise<any[]> {
    // Get sites where user is not the owner but has access through sharing
    const teamSites = await db
      .select({
        site: sites,
        owner: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(sites)
      .innerJoin(users, eq(sites.userId, users.id))
      .where(ne(sites.userId, userId))
      .orderBy(desc(sites.createdAt));
    
    return teamSites;
  }

  async createSite(siteData: InsertSite): Promise<Site> {
    const [site] = await db.insert(sites).values(siteData).returning();
    
    // Log the activity
    await this.logActivity({
      userId: siteData.userId,
      activityType: 'site_created',
      description: `Created site "${site.name}" for prospect ${site.prospectName}`,
      entityId: site.id,
      entityType: 'site',
      metadata: {
        siteName: site.name,
        prospectName: site.prospectName,
        prospectEmail: site.prospectEmail,
        templateId: site.templateId,
      },
    });
    
    return site;
  }

  async getSite(siteId: string, userId: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    if (site && site.userId === userId) {
      return site;
    }
    return undefined;
  }

  async updateSite(siteId: string, userId: string, updates: Partial<Site>): Promise<Site | undefined> {
    const [site] = await db
      .update(sites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sites.id, siteId))
      .returning();
    
    if (site && site.userId === userId) {
      return site;
    }
    return undefined;
  }

  async deleteSite(siteId: string, userId: string): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, siteId)).returning();
    return result.length > 0 && result[0].userId === userId;
  }

  async getPublicSite(siteId: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    return site;
  }

  async authenticateProspectSite(siteId: string, password: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    if (site && (!site.accessPassword || site.accessPassword === password)) {
      return site;
    }
    return undefined;
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(templateData).returning();
    return template;
  }

  // Content operations
  async getUserContent(userId: string): Promise<ContentItem[]> {
    return await db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.createdAt));
  }

  async createContentItem(contentData: InsertContentItem): Promise<ContentItem> {
    const [content] = await db.insert(contentItems).values(contentData).returning();
    return content;
  }

  // Analytics operations
  async getSiteAnalytics(siteId: string, userId: string): Promise<any> {
    const site = await this.getSite(siteId, userId);
    if (!site) return null;

    const views = await db.select().from(siteViews).where(eq(siteViews.siteId, siteId));
    return {
      totalViews: views.length,
      views: views.slice(0, 10), // Recent 10 views
    };
  }

  async recordSiteView(viewData: InsertSiteView): Promise<void> {
    await db.insert(siteViews).values(viewData);
    
    // Get current site and increment views
    const [currentSite] = await db.select().from(sites).where(eq(sites.id, viewData.siteId));
    if (currentSite) {
      await db
        .update(sites)
        .set({ 
          views: (currentSite.views || 0) + 1,
          lastAccessed: new Date()
        })
        .where(eq(sites.id, viewData.siteId));
    }
  }

  // Prospects operations
  async getProspects(userId: string): Promise<Prospect[]> {
    return await db.select().from(prospects).where(eq(prospects.userId, userId)).orderBy(desc(prospects.createdAt));
  }

  async createProspect(prospectData: InsertProspect): Promise<Prospect> {
    const [prospect] = await db.insert(prospects).values(prospectData).returning();
    
    // Log the activity
    await this.logActivity({
      userId: prospectData.userId,
      activityType: 'prospect_added',
      description: `Added prospect "${prospect.name}" (${prospect.email})`,
      entityId: prospect.id,
      entityType: 'prospect',
      metadata: {
        prospectName: prospect.name,
        prospectEmail: prospect.email,
        company: prospect.company,
      },
    });
    
    return prospect;
  }

  async updateProspect(prospectId: string, userId: string, updates: Partial<Prospect>): Promise<Prospect | undefined> {
    const [prospect] = await db
      .update(prospects)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)))
      .returning();
    return prospect;
  }

  async deleteProspect(prospectId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(prospects)
      .where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // File operations
  async getUserFiles(userId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.userId, userId)).orderBy(desc(files.createdAt));
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Activity logging operations
  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db
      .insert(activityLog)
      .values(activityData)
      .returning();
    return activity;
  }

  async getActivityLog(): Promise<ActivityLog[]> {
    const activities = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        activityType: activityLog.activityType,
        description: activityLog.description,
        entityId: activityLog.entityId,
        entityType: activityLog.entityType,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(100);

    return activities as ActivityLog[];
  }
}

export const storage = new DatabaseStorage();
