import {
  users,
  sites,
  templates,
  contentItems,
  siteViews,
  prospects,
  files,
  userInvitations,
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
  type UserInvitation,
  type InsertUserInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, ne, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
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

  // Access code and user invitation operations
  generateAccessCode(siteId: string): Promise<string>;
  validateAccessCode(accessCode: string): Promise<Site | undefined>;
  createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getUserInvitationByAccessCode(accessCode: string): Promise<UserInvitation | undefined>;
  updateUserInvitation(invitationId: string, updates: Partial<UserInvitation>): Promise<UserInvitation | undefined>;
  registerUserFromInvitation(invitationId: string, userId: string): Promise<void>;
  getUserInvitationByVerificationToken(token: string): Promise<UserInvitation | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllSites(): Promise<Site[]>;
}

export class DatabaseStorage implements IStorage {
  // Admin-only user management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }


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

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
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
  async getUserSites(userId: string, userRole?: string): Promise<Site[]> {
    // Admins can see all sites, regular users only their own
    if (userRole === 'admin') {
      return await db.select().from(sites).orderBy(desc(sites.createdAt));
    }
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
    return site;
  }

  async getSite(siteId: string, userId: string, userRole?: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    // Admins can access any site, regular users only their own
    if (site && (userRole === 'admin' || site.userId === userId)) {
      return site;
    }
    return undefined;
  }

  async updateSite(siteId: string, userId: string, updates: Partial<Site>, userRole?: string): Promise<Site | undefined> {
    const [site] = await db
      .update(sites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sites.id, siteId))
      .returning();
    
    // Admins can update any site, regular users only their own
    if (site && (userRole === 'admin' || site.userId === userId)) {
      return site;
    }
    return undefined;
  }

  async deleteSite(siteId: string, userId: string, userRole?: string): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, siteId)).returning();
    // Admins can delete any site, regular users only their own
    return result.length > 0 && (userRole === 'admin' || result[0].userId === userId);
  }

  async getPublicSite(siteId: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    return site;
  }

  async authenticateProspectSite(siteId: string, password: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    
    if (!site) {
      return undefined;
    }
    
    // If site has no access code, authenticate immediately
    if (!site.accessCode) {
      return site;
    }
    
    // Check access code
    if (site.accessCode === password) {
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
  async getProspects(userId: string, userRole?: string): Promise<Prospect[]> {
    // Admins can see all prospects, regular users only their own
    if (userRole === 'admin') {
      return await db.select().from(prospects).orderBy(desc(prospects.createdAt));
    }
    return await db.select().from(prospects).where(eq(prospects.userId, userId)).orderBy(desc(prospects.createdAt));
  }

  async createProspect(prospectData: InsertProspect): Promise<Prospect> {
    const [prospect] = await db.insert(prospects).values(prospectData).returning();
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

  // Access code and user invitation operations
  async generateAccessCode(siteId: string): Promise<string> {
    // Generate a unique 8-character access code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let accessCode = '';
    
    for (let i = 0; i < 8; i++) {
      accessCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Update the site with the access code
    await db
      .update(sites)
      .set({ accessCode, updatedAt: new Date() })
      .where(eq(sites.id, siteId));
    
    return accessCode;
  }

  async validateAccessCode(accessCode: string): Promise<Site | undefined> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.accessCode, accessCode), eq(sites.isActive, true)));
    return site;
  }

  async createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [newInvitation] = await db
      .insert(userInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getUserInvitationByAccessCode(accessCode: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.accessCode, accessCode));
    return invitation;
  }

  async updateUserInvitation(invitationId: string, updates: Partial<UserInvitation>): Promise<UserInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(userInvitations)
      .set({ ...updates })
      .where(eq(userInvitations.id, invitationId))
      .returning();
    return updatedInvitation;
  }

  async registerUserFromInvitation(invitationId: string, userId: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ 
        registeredUserId: userId, 
        status: 'registered',
        registeredAt: new Date()
      })
      .where(eq(userInvitations.id, invitationId));
  }

  async getUserInvitationByVerificationToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.verificationToken, token))
      .limit(1);
    return invitation;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

}

export const storage = new DatabaseStorage();
