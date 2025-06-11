import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSiteSchema, insertTemplateSchema, insertContentItemSchema, insertSiteViewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Sites routes
  app.get('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sites = await storage.getUserSites(userId);
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.post('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const siteData = insertSiteSchema.parse({ ...req.body, userId });
      const site = await storage.createSite(siteData);
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid site data", errors: error.errors });
      }
      console.error("Error creating site:", error);
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  app.get('/api/sites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const site = await storage.getSite(req.params.id, userId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.patch('/api/sites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const site = await storage.updateSite(req.params.id, userId, updates);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error updating site:", error);
      res.status(500).json({ message: "Failed to update site" });
    }
  });

  app.delete('/api/sites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteSite(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Templates routes
  app.get('/api/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req, res) => {
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
  app.get('/api/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const content = await storage.getUserContent(userId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Analytics routes
  app.get('/api/sites/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      
      // Create sample data for the template
      const sampleData = {
        company: "Acme Corporation",
        tagline: "Innovative Solutions for Modern Business",
        problem_statement: "Businesses struggle with outdated processes that limit growth and efficiency.",
        solution_details: "Our cutting-edge platform streamlines operations and drives measurable results.",
        feature_1: "Advanced Analytics Dashboard",
        feature_2: "Real-time Collaboration Tools", 
        feature_3: "Automated Workflow Management",
        pricing_info: "Starting at $99/month with flexible scaling options",
        call_to_action: "Schedule a demo to see how we can transform your business",
        product_name: "ProSuite Platform",
        product_tagline: "The complete business automation solution",
        startup_name: "TechFlow Solutions",
        elevator_pitch: "Revolutionizing business processes through AI-powered automation"
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

  // Public site access (for prospects)
  app.get('/site/:id', async (req, res) => {
    try {
      const site = await storage.getPublicSite(req.params.id);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      // Record view
      await storage.recordSiteView({
        siteId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(site);
    } catch (error) {
      console.error("Error fetching public site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.post('/site/:id/authenticate', async (req, res) => {
    try {
      const { password } = req.body;
      const site = await storage.authenticateProspectSite(req.params.id, password);
      if (!site) {
        return res.status(401).json({ message: "Invalid site or password" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error authenticating site:", error);
      res.status(500).json({ message: "Failed to authenticate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
