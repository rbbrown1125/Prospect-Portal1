import {
  users,
  sites,
  templates,
  contentItems,
  siteViews,
  type User,
  type UpsertUser,
  type Site,
  type InsertSite,
  type Template,
  type InsertTemplate,
  type ContentItem,
  type InsertContentItem,
  type InsertSiteView,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<any>;
  
  // Site operations
  getUserSites(userId: string): Promise<Site[]>;
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
  
  // Analytics operations
  getSiteAnalytics(siteId: string, userId: string): Promise<any>;
  recordSiteView(viewData: InsertSiteView): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
      .where(
        and(
          ne(sites.userId, userId),
          // For now, we'll show all other users' sites as "team sites"
          // Later this can be filtered by actual team membership
          sql`true`
        )
      )
      .orderBy(desc(sites.createdAt));
    
    return teamSites;
  }

  async createSite(siteData: InsertSite): Promise<Site> {
    const [site] = await db.insert(sites).values(siteData).returning();
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
}

export const storage = new DatabaseStorage();
