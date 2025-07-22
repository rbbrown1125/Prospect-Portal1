import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, userInvitations } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { upload, processProfilePicture, deleteOldProfilePicture } from "./upload";
import { eq } from "drizzle-orm";
import { db } from "./db";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      company?: string | null;
      title?: string | null;
      location?: string | null;
      profileImageUrl?: string | null;
      role: string; // 'admin' or 'user'
      createdAt?: Date | null;
      updatedAt?: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function validateGodlanEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@godlan.com");
}

function determineUserRole(email: string): string {
  // Admin emails - these users get admin privileges
  const adminEmails = [
    'admin@godlan.com',
    'superuser@godlan.com',
    'manager@godlan.com'
  ];
  
  const normalizedEmail = email.toLowerCase();
  
  // Check if email is in admin list
  if (adminEmails.includes(normalizedEmail)) {
    return 'admin';
  }
  
  // Default role for all other @godlan.com users
  return 'user';
}

// Middleware to check if user is admin
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  
  next();
}

// Middleware to check if user can access resource (admin can access all, users only their own)
export function requireOwnershipOrAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admins can access everything
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Regular users can only access their own resources
  // This will be handled in individual route handlers
  next();
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }

          // Update last login
          await storage.updateUserLastLogin(user.id);
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!validateGodlanEmail(email)) {
        return res.status(400).json({ message: "Only @godlan.com email addresses are allowed" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const userRole = determineUserRole(email);
      
      const userData: InsertUser = {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: userRole,
        isActive: true,
      };

      const user = await storage.createUser(userData);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phone: req.user.phone,
      company: req.user.company,
      title: req.user.title,
      location: req.user.location,
      profileImageUrl: req.user.profileImageUrl,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  });

  // Admin-only user management routes
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/sites", requireAdmin, async (req: any, res) => {
    try {
      const sites = await storage.getAllSites();
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.patch("/api/admin/users/:userId/role", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'user'" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/admin/users/:userId/status", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUserStatus(userId, isActive);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Email verification routes
  app.get("/api/verify-email/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getUserInvitationByVerificationToken(token);
      if (!invitation || invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - new Date(invitation.createdAt).getTime();
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: "Verification link has expired" });
      }

      res.json({
        success: true,
        invitation: {
          id: invitation.id,
          prospectName: invitation.prospectName,
          prospectEmail: invitation.prospectEmail,
          siteName: invitation.siteName
        }
      });
    } catch (error) {
      console.error("Error verifying email token:", error);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  app.post("/api/verify-email/:token/set-password", async (req: any, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const invitation = await storage.getUserInvitationByVerificationToken(token);
      if (!invitation || invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - new Date(invitation.createdAt).getTime();
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: "Verification link has expired" });
      }

      // Find the user and set their password
      if (!invitation.registeredUserId) {
        return res.status(400).json({ message: "User account not found for this invitation" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.updateUserPassword(invitation.registeredUserId, hashedPassword);
      if (!user) {
        return res.status(400).json({ message: "Failed to set password" });
      }

      // Mark invitation as verified
      await storage.updateUserInvitation(invitation.id, {
        status: 'verified',
        verifiedAt: new Date()
      });

      res.json({
        success: true,
        message: "Password set successfully! You can now log in."
      });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ message: "Failed to set password. Please try again." });
    }
  });

  // Access code validation and user registration routes
  app.post("/api/validate-access-code", async (req: any, res) => {
    try {
      const { accessCode } = req.body;
      
      if (!accessCode) {
        return res.status(400).json({ message: "Access code is required" });
      }
      
      const site = await storage.validateAccessCode(accessCode);
      if (!site) {
        return res.status(404).json({ message: "Invalid or expired access code" });
      }
      
      res.json({
        success: true,
        siteName: site.name,
        welcomeMessage: site.welcomeMessage || `Welcome to ${site.name}! Please create your account to continue.`,
      });
    } catch (error) {
      console.error("Error validating access code:", error);
      res.status(500).json({ message: "Failed to validate access code" });
    }
  });

  app.post("/api/register-with-access-code", async (req: any, res) => {
    try {
      const { accessCode, name, title, email } = req.body;
      
      if (!accessCode || !name || !email) {
        return res.status(400).json({ message: "Access code, name, and email are required" });
      }
      
      // Validate access code
      const site = await storage.validateAccessCode(accessCode);
      if (!site) {
        return res.status(404).json({ message: "Invalid or expired access code" });
      }
      
      // Check if user already registered with this access code
      const existingInvitation = await storage.getUserInvitationByAccessCode(accessCode);
      if (existingInvitation && existingInvitation.status === 'registered') {
        return res.status(400).json({ message: "This access code has already been used" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        // Link existing user to this site
        if (existingInvitation) {
          await storage.registerUserFromInvitation(existingInvitation.id, existingUser.id);
        } else {
          await storage.createUserInvitation({
            email: email.toLowerCase(),
            name,
            title: title || null,
            siteId: site.id,
            accessCode,
            status: 'registered',
            registeredUserId: existingUser.id,
            registeredAt: new Date(),
          });
        }
        
        // Log in the existing user
        req.login(existingUser, (err: any) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({
            success: true,
            user: {
              id: existingUser.id,
              email: existingUser.email,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              role: existingUser.role,
            },
            siteId: site.id,
            message: "Welcome back! You've been granted access to this site."
          });
        });
        return;
      }
      
      // Create new user invitation (they'll need to set a password later)
      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      
      const invitation = await storage.createUserInvitation({
        email: email.toLowerCase(),
        name,
        title: title || null,
        siteId: site.id,
        accessCode,
        status: 'pending',
        verificationToken,
      });
      
      // Create a temporary user account (no password yet)
      const [firstName, ...lastNameParts] = name.trim().split(' ');
      const lastName = lastNameParts.join(' ');
      
      const user = await storage.createUser({
        email: email.toLowerCase(),
        firstName: firstName || '',
        lastName: lastName || '',
        title: title || null,
        password: '', // Will be set during verification
        role: 'user',
      });

      // Register the user with the invitation
      await storage.registerUserFromInvitation(invitation.id, user.id);

      // Create and send verification email
      const { sendVerificationEmail } = await import('./sendgrid');
      const emailSent = await sendVerificationEmail(
        user.email, 
        `${user.firstName} ${user.lastName}`.trim() || user.email,
        invitation.verificationToken
      );

      console.log(`User created for invitation: ${user.email}, Email sent: ${emailSent}`);
      
      res.json({
        success: true,
        message: "Registration successful! A verification email has been sent to your email address.",
        requiresVerification: true,
        siteId: site.id,
      });
    } catch (error) {
      console.error("Error registering with access code:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/verify-email", async (req: any, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Find invitation by token
      const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.verificationToken, token));
      if (!invitation) {
        return res.status(404).json({ message: "Invalid verification token" });
      }
      
      // Create user account
      const hashedPassword = await hashPassword(password);
      const userData = {
        email: invitation.email,
        password: hashedPassword,
        firstName: invitation.name.split(' ')[0] || null,
        lastName: invitation.name.split(' ').slice(1).join(' ') || null,
        title: invitation.title,
        role: 'user',
        isActive: true,
      };
      
      const user = await storage.createUser(userData);
      
      // Update invitation status
      await storage.updateUserInvitation(invitation.id, {
        status: 'verified',
        registeredUserId: user.id,
        verifiedAt: new Date(),
      });
      
      // Log in the new user
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          siteId: invitation.siteId,
          message: "Account verified successfully! Welcome!"
        });
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Update user profile endpoint
  app.patch("/api/user/profile", async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      // Only allow updating certain fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'company', 'title', 'location'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      const user = await storage.updateUser(userId, filteredUpdates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile picture endpoint
  app.post("/api/user/profile-picture", upload.single('profilePicture'), async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      
      // Get current user data to check for existing profile picture
      const currentUser = await storage.getUser(userId);
      
      // Process and save the new profile picture
      const profileImageUrl = await processProfilePicture(
        req.file.buffer,
        userId,
        req.file.originalname
      );
      
      // Delete old profile picture if it exists
      if (currentUser?.profileImageUrl) {
        await deleteOldProfilePicture(currentUser.profileImageUrl);
      }
      
      // Update user with new profile picture URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        profileImageUrl,
        message: "Profile picture updated successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}