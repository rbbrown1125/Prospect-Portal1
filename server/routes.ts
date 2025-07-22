import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireOwnershipOrAdmin } from "./auth";
import { insertSiteSchema, insertTemplateSchema, insertContentItemSchema, insertSiteViewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // UUID validation helper
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Auth middleware
  setupAuth(app);

  // Optimized dashboard endpoint (combines multiple queries for better performance)
  app.get('/api/dashboard/data', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Fetch all dashboard data in parallel for 3x faster loading
      const [stats, mySites, teamSites] = await Promise.all([
        storage.getDashboardStats(userId),
        storage.getMySites(userId),
        storage.getTeamSites(userId)
      ]);
      
      res.json({
        stats,
        mySites,
        teamSites
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Sites routes
  app.get('/api/sites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const sites = await storage.getUserSites(userId, userRole);
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.get('/api/sites/my', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mySites = await storage.getMySites(userId);
      res.json(mySites);
    } catch (error) {
      console.error("Error fetching my sites:", error);
      res.status(500).json({ message: "Failed to fetch my sites" });
    }
  });

  app.get('/api/sites/team', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamSites = await storage.getTeamSites(userId);
      res.json(teamSites);
    } catch (error) {
      console.error("Error fetching team sites:", error);
      res.status(500).json({ message: "Failed to fetch team sites" });
    }
  });

  app.post('/api/sites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const siteData = insertSiteSchema.parse({ ...req.body, userId });
      
      // Create the site
      const site = await storage.createSite(siteData);
      
      // Create a prospect record for this site
      if (site.prospectName && site.prospectEmail) {
        try {
          await storage.createProspect({
            userId,
            name: site.prospectName,
            email: site.prospectEmail,
            company: site.prospectCompany || '',
            status: 'new',
            siteId: site.id,
            notes: `Site "${site.name}" created for this prospect`,
          });
        } catch (prospectError) {
          console.error("Error creating prospect record:", prospectError);
          // Don't fail site creation if prospect creation fails
        }
      }
      
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid site data", errors: error.errors });
      }
      console.error("Error creating site:", error);
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  app.get('/api/sites/:id', requireAuth, async (req: any, res) => {
    try {
      const siteId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Validate UUID format
      if (!siteId || siteId === 'undefined' || !isValidUUID(siteId)) {
        return res.status(400).json({ message: "Invalid site ID format" });
      }
      
      const site = await storage.getSite(siteId, userId, userRole);
      if (!site) {
        return res.status(404).json({ message: "Site not found or access denied" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.patch('/api/sites/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const updates = req.body;
      const site = await storage.updateSite(req.params.id, userId, updates, userRole);
      if (!site) {
        return res.status(404).json({ message: "Site not found or access denied" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error updating site:", error);
      res.status(500).json({ message: "Failed to update site" });
    }
  });

  app.delete('/api/sites/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const success = await storage.deleteSite(req.params.id, userId, userRole);
      if (!success) {
        return res.status(404).json({ message: "Site not found or access denied" });
      }
      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Templates routes - available to all authenticated users
  app.get('/api/templates', requireAuth, async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Admin-only template management
  app.post('/api/templates', requireAdmin, async (req: any, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Admin route to generate access code for a site
  app.post('/api/sites/:id/generate-access-code', requireAdmin, async (req: any, res) => {
    try {
      const siteId = req.params.id;
      const { welcomeMessage } = req.body;
      
      // Validate UUID format
      if (!siteId || siteId === 'undefined' || !isValidUUID(siteId)) {
        return res.status(400).json({ message: "Invalid site ID format" });
      }
      
      // Check if site exists
      const site = await storage.getPublicSite(siteId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      // Generate access code
      const accessCode = await storage.generateAccessCode(siteId);
      
      // Update welcome message if provided
      if (welcomeMessage) {
        await storage.updateSite(siteId, req.user.id, { welcomeMessage }, req.user.role);
      }
      
      res.json({
        success: true,
        accessCode,
        message: "Access code generated successfully"
      });
    } catch (error) {
      console.error("Error generating access code:", error);
      res.status(500).json({ message: "Failed to generate access code" });
    }
  });

  app.post('/api/templates', requireAuth, async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Content library routes
  app.get('/api/content', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const content = await storage.getUserContent(userId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contentData = insertContentItemSchema.parse({ ...req.body, userId });
      const content = await storage.createContentItem(contentData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Prospects routes
  app.get('/api/prospects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const prospects = await storage.getProspects(userId, userRole);
      res.json(prospects);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      res.status(500).json({ message: "Failed to fetch prospects" });
    }
  });

  app.post('/api/prospects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prospectData = {
        ...req.body,
        userId,
      };
      const prospect = await storage.createProspect(prospectData);
      res.json(prospect);
    } catch (error) {
      console.error("Error creating prospect:", error);
      res.status(500).json({ message: "Failed to create prospect" });
    }
  });

  app.patch('/api/prospects/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prospectId = req.params.id;
      const prospect = await storage.updateProspect(prospectId, userId, req.body);
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      res.json(prospect);
    } catch (error) {
      console.error("Error updating prospect:", error);
      res.status(500).json({ message: "Failed to update prospect" });
    }
  });

  app.delete('/api/prospects/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prospectId = req.params.id;
      const deleted = await storage.deleteProspect(prospectId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      res.json({ message: "Prospect deleted successfully" });
    } catch (error) {
      console.error("Error deleting prospect:", error);
      res.status(500).json({ message: "Failed to delete prospect" });
    }
  });

  // Files routes
  app.get('/api/files', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const files = await storage.getUserFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post('/api/files', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fileData = {
        ...req.body,
        userId,
      };
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.delete('/api/files/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fileId = req.params.id;
      const deleted = await storage.deleteFile(fileId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Analytics routes
  app.get('/api/sites/:id/analytics', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analytics = await storage.getSiteAnalytics(req.params.id, userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Template preview route
  app.get('/preview/template/:id', async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      const template = templates.find(t => t.id === parseInt(req.params.id));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Create comprehensive sample data for the template
      const sampleData = {
        // Prospect information
        prospect_name: "John Smith",
        company_name: "Acme Corporation", 
        company: "Acme Corporation",
        
        // Contact information
        contact_name: "Sarah Johnson",
        contact_email: "sarah.johnson@example.com",
        contact_phone: "(555) 123-4567",
        
        // File/Document names
        proposal_doc: "Acme-Custom-Proposal-2025.pdf",
        case_study: "ROI-Analysis-Similar-Company.pdf",
        pricing_sheet: "Acme-Pricing-Breakdown.xlsx",
        main_proposal: "Complete-Business-Proposal.pdf",
        technical_specs: "Technical-Implementation-Guide.pdf",
        video_presentation: "Executive-Summary-Presentation.mp4",
        implementation_plan: "Project-Timeline-Roadmap.pdf",
        brand_guidelines: "Acme-Brand-Style-Guide.pdf",
        
        // Business details
        tagline: "Innovative Solutions for Modern Business",
        problem_statement: "Businesses struggle with outdated processes that limit growth and efficiency.",
        solution_details: "Our cutting-edge platform streamlines operations and drives measurable results.",
        feature_1: "Advanced Analytics Dashboard",
        feature_2: "Real-time Collaboration Tools", 
        feature_3: "Automated Workflow Management",
        pricing_info: "Starting at $99/month with flexible scaling options",
        call_to_action: "Schedule a demo to see how we can transform your business",
        
        // Product information
        product_name: "ProSuite Platform",
        product_tagline: "The complete business automation solution",
        startup_name: "TechFlow Solutions",
        elevator_pitch: "Revolutionizing business processes through AI-powered automation",
        
        // Usage and support
        usage_scope: "enterprise",
        tech_support: "support@techflow.com",
        
        // Additional variables
        deadline: "March 30, 2025",
        budget_range: "$50,000 - $100,000",
        team_size: "15-20 employees",
        industry: "Manufacturing"
      };
      
      res.json({
        template,
        sampleData,
        previewMode: true
      });
    } catch (error) {
      console.error("Error fetching template preview:", error);
      res.status(500).json({ message: "Failed to fetch template preview" });
    }
  });



  // Public site API routes (for prospects)
  app.get('/api/public/sites/:id', async (req, res) => {
    try {
      const siteId = req.params.id;
      
      // Validate UUID format
      if (!siteId || siteId === 'undefined' || !isValidUUID(siteId)) {
        return res.status(400).json({ message: "Invalid site ID format" });
      }
      
      const site = await storage.getPublicSite(siteId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      // Only return basic info, not the full site content
      res.json({ 
        id: site.id, 
        name: site.name, 
        requiresPassword: !!site.accessPassword 
      });
    } catch (error) {
      console.error("Error fetching public site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.post('/api/public/sites/:id/authenticate', async (req, res) => {
    try {
      const siteId = req.params.id;
      const { password } = req.body;
      
      // Validate UUID format
      if (!siteId || siteId === 'undefined' || !isValidUUID(siteId)) {
        return res.status(400).json({ message: "Invalid site ID format" });
      }
      
      const site = await storage.authenticateProspectSite(siteId, password);
      
      if (!site) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      res.json(site);
    } catch (error) {
      console.error("Error authenticating site:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post('/api/public/sites/:id/view', async (req, res) => {
    try {
      const siteId = req.params.id;
      
      // Validate UUID format
      if (!siteId || siteId === 'undefined' || !isValidUUID(siteId)) {
        return res.status(400).json({ message: "Invalid site ID format" });
      }
      
      await storage.recordSiteView({
        siteId,
        viewedAt: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording site view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
