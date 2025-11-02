import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedTemplates } from "./seed";
import { initializeDatabase } from "./init";
import { createServer } from 'http';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Set environment defaults
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
      log("NODE_ENV not set, defaulting to development");
    }
    
    // Initialize database and test data on first run
    await initializeDatabase();
    
    const server = await registerRoutes(app);
    
    // Seed templates on startup (non-blocking)
    seedTemplates().catch(err => {
      log(`Template seeding might have failed (this is okay if templates already exist): ${err.message}`, "seed");
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error for debugging
      console.error('Error in request:', err);
      
      // Send response but DON'T throw the error again
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    
    // Handle port conflicts more gracefully
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use.`);
        console.log(`Attempting to kill existing process...`);
        process.exit(1);
      } else {
        throw error;
      }
    });
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`✅ Server running on http://0.0.0.0:${port}`);
      console.log('\n🎉 Application is ready!');
      console.log('=====================================');
      console.log('Login with these test accounts:');
      console.log('  • admin@godlan.com / Admin123!');
      console.log('  • manager@godlan.com / Manager123!');
      console.log('  • john.smith@godlan.com / User123!');
      console.log('=====================================\n');
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
