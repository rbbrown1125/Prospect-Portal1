// Simple in-memory storage implementation - no database needed
import { nanoid } from "nanoid";

// In-memory data stores
const sites = new Map();
const templates = new Map();
const prospects = new Map();
const contentItems = new Map();

// Initialize with sample data
function initializeSampleData() {
  // Add sample templates
  const template1 = {
    id: 1,
    name: "Professional Services",
    description: "Clean professional template",
    category: "Business",
    content: { sections: [] },
    createdAt: new Date()
  };
  templates.set(template1.id, template1);

  const template2 = {
    id: 2,
    name: "Manufacturing",
    description: "Industrial template",
    category: "Manufacturing",
    content: { sections: [] },
    createdAt: new Date()
  };
  templates.set(template2.id, template2);
  
  console.log('✓ Sample templates initialized');
}

// Simple storage interface that works without database
export const simpleStorage = {
  // Initialize
  init() {
    initializeSampleData();
  },

  // User operations (handled by simple-auth.ts)
  
  // Sites
  async getUserSites(userId: string) {
    return Array.from(sites.values()).filter(s => s.userId === userId);
  },

  async getMySites(userId: string) {
    return Array.from(sites.values()).filter(s => s.userId === userId);
  },

  async getTeamSites(userId: string) {
    return []; // No team sites in simple mode
  },

  async createSite(siteData: any) {
    const id = nanoid();
    const site = {
      id,
      ...siteData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    sites.set(id, site);
    return site;
  },

  async getSite(siteId: string, userId: string) {
    const site = sites.get(siteId);
    if (site && site.userId === userId) {
      return site;
    }
    return undefined;
  },

  async updateSite(siteId: string, userId: string, updates: any) {
    const site = sites.get(siteId);
    if (site && site.userId === userId) {
      Object.assign(site, updates, { updatedAt: new Date() });
      return site;
    }
    return undefined;
  },

  async deleteSite(siteId: string, userId: string) {
    const site = sites.get(siteId);
    if (site && site.userId === userId) {
      sites.delete(siteId);
      return true;
    }
    return false;
  },

  // Templates
  async getTemplates() {
    return Array.from(templates.values());
  },

  async createTemplate(templateData: any) {
    const id = templates.size + 1;
    const template = {
      id,
      ...templateData,
      createdAt: new Date()
    };
    templates.set(id, template);
    return template;
  },

  // Content
  async getUserContent(userId: string) {
    return Array.from(contentItems.values()).filter(c => c.userId === userId);
  },

  async createContentItem(contentData: any) {
    const id = contentItems.size + 1;
    const item = {
      id,
      ...contentData,
      createdAt: new Date()
    };
    contentItems.set(id, item);
    return item;
  },

  // Prospects
  async getProspects(userId: string) {
    return Array.from(prospects.values()).filter(p => p.userId === userId);
  },

  async createProspect(prospectData: any) {
    const id = nanoid();
    const prospect = {
      id,
      ...prospectData,
      createdAt: new Date()
    };
    prospects.set(id, prospect);
    return prospect;
  },

  async updateProspect(prospectId: string, userId: string, updates: any) {
    const prospect = prospects.get(prospectId);
    if (prospect && prospect.userId === userId) {
      Object.assign(prospect, updates, { updatedAt: new Date() });
      return prospect;
    }
    return undefined;
  },

  async deleteProspect(prospectId: string, userId: string) {
    const prospect = prospects.get(prospectId);
    if (prospect && prospect.userId === userId) {
      prospects.delete(prospectId);
      return true;
    }
    return false;
  },

  // Dashboard stats
  async getDashboardStats(userId: string) {
    const userSites = Array.from(sites.values()).filter(s => s.userId === userId);
    return {
      activeSites: userSites.length,
      totalViews: userSites.reduce((sum, s) => sum + (s.views || 0), 0),
      uniqueProspects: new Set(userSites.map(s => s.prospectEmail)).size,
      recentActivity: []
    };
  },

  // Site analytics
  async getSiteAnalytics(siteId: string, userId: string) {
    const site = sites.get(siteId);
    if (site && site.userId === userId) {
      return {
        totalViews: site.views || 0,
        uniqueViews: site.views || 0,
        views: []
      };
    }
    return null;
  },

  async recordSiteView(viewData: any) {
    const site = sites.get(viewData.siteId);
    if (site) {
      site.views = (site.views || 0) + 1;
      site.lastAccessed = new Date();
    }
  },

  // Access codes
  async generateAccessCode(siteId: string) {
    const code = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const site = sites.get(siteId);
    if (site) {
      site.accessCode = code;
    }
    return code;
  },

  async validateAccessCode(accessCode: string) {
    const site = Array.from(sites.values()).find(s => s.accessCode === accessCode);
    return site;
  },

  // Public site access
  async getPublicSite(siteId: string) {
    return sites.get(siteId);
  },

  async authenticateProspectSite(siteId: string, password: string) {
    const site = sites.get(siteId);
    if (site && site.password === password) {
      return site;
    }
    return undefined;
  }
};