import { Router } from 'express';
import { db } from '../db';
import { sites, siteViews, prospects } from '@shared/schema';
import { requireAuth } from '../auth';
import { eq, desc, count, sql } from 'drizzle-orm';

const router = Router();

// Optimized dashboard endpoint that combines multiple queries
router.get('/api/dashboard/data', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Execute all queries in parallel for better performance
    const [userSites, siteViewsData, userProspects, templates] = await Promise.all([
      // Get user sites
      db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt)),
      
      // Get site views with site info
      db.select({
        siteId: siteViews.siteId,
        viewedAt: siteViews.viewedAt,
        siteName: sites.name,
      })
        .from(siteViews)
        .innerJoin(sites, eq(siteViews.siteId, sites.id))
        .where(eq(sites.userId, userId))
        .orderBy(desc(siteViews.viewedAt))
        .limit(100),
        
      // Get prospects
      db.select().from(prospects).where(eq(prospects.userId, userId)),
      
      // Get template count (cached on client)
      db.execute(sql`SELECT COUNT(*) as count FROM templates`)
    ]);

    // Calculate stats
    const activeSites = userSites.filter(site => site.isActive !== false).length;
    const totalViews = siteViewsData.length;
    const uniqueProspects = new Set(userSites.filter(s => s.prospectEmail).map(s => s.prospectEmail)).size;
    
    // Get recent activity
    const recentActivity = siteViewsData.slice(0, 5).map(view => ({
      siteName: view.siteName || 'Unknown Site',
      viewedAt: view.viewedAt,
    }));
    
    // Prepare response data
    const dashboardData = {
      stats: {
        totalSites: userSites.length,
        activeSites,
        totalViews,
        totalProspects: userProspects.length,
        activeProspects: uniqueProspects,
        engagementRate: userSites.length > 0 ? Math.round((totalViews / userSites.length) * 10) : 0,
        recentViews: siteViewsData.filter(v => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(v.viewedAt) > dayAgo;
        }).length,
      },
      mySites: userSites.slice(0, 6), // Latest 6 sites
      teamSites: [], // Placeholder for team functionality
      recentActivity,
      templateCount: templates.rows[0]?.count || 0,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;