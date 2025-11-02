import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";

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
    console.log('\n🚀 Starting application...\n');
    
    // Set environment defaults
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Hardcode session secret if not set
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = config.session.secret;
      console.log('✓ Using hardcoded session secret');
    }
    
    // Initialize server
    const server = await registerRoutes(app);
    
    // Simple error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Request error:', err.message);
      res.status(status).json({ message });
    });

    // Setup vite or static files
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server on port 5000
    const port = config.app.port;
    const host = config.app.host;
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
        process.exit(1);
      }
      throw error;
    });
    
    server.listen({ port, host }, () => {
      log(`✅ Server running on http://${host}:${port}`);
      console.log('\n====================================');
      console.log('🎉 Application Ready!');
      console.log('====================================');
      console.log('\nHardcoded Test Accounts:');
      console.log('  • admin@godlan.com / Admin123!');
      console.log('  • manager@godlan.com / Manager123!');
      console.log('  • john.smith@godlan.com / User123!');
      console.log('\n✨ No database or API keys needed!');
      console.log('====================================\n');
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
})();
