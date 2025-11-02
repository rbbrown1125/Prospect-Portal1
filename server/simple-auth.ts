import { Express } from "express";
import session from "express-session";
import createMemoryStore from 'memorystore';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { config, TEST_USERS } from "./config";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

// Simple in-memory session store (no database needed)
const sessions = new Map();

// Simple in-memory user store with hardcoded test users
const users = new Map();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

// Initialize hardcoded test users
async function initializeUsers() {
  console.log('Initializing hardcoded test users...');
  
  for (const user of TEST_USERS) {
    const hashedPassword = await hashPassword(user.password);
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    
    users.set(user.email, {
      id: userId,
      email: user.email,
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true
    });
    
    console.log(`  ✓ ${user.email} (${user.role})`);
  }
  
  console.log('Test users ready!');
}


export function setupSimpleAuth(app: Express) {
  // Initialize users on startup
  initializeUsers();
  
  // Simple session configuration with memory store
  app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: config.session.maxAge
    }
  }));
  
  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      // Check hardcoded users
      const user = users.get(email.toLowerCase());
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await comparePasswords(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
      
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/user", (req, res) => {
    const session = req.session as any;
    
    if (!session || !session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json(session.user);
  });
  
  // Register endpoint (creates session for new @godlan.com users)
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      if (!email.toLowerCase().endsWith("@godlan.com")) {
        return res.status(400).json({ message: "Only @godlan.com emails allowed" });
      }
      
      if (users.has(email.toLowerCase())) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create new user in memory
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'user',
        isActive: true
      };
      
      users.set(email.toLowerCase(), newUser);
      
      // Create session
      (req.session as any).userId = userId;
      (req.session as any).user = {
        id: userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      };
      
      res.status(201).json({
        id: userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
}

// Simple auth middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}