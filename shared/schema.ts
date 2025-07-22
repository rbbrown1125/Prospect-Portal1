import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with role-based authentication
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 100 }),
  title: varchar("title", { length: 100 }),
  location: varchar("location", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: varchar("role", { length: 50 }).default("user").notNull(), // 'admin' or 'user'
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Templates for site generation
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  thumbnail: varchar("thumbnail"),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prospect sites with unique access code system
export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: integer("template_id").references(() => templates.id),
  prospectName: varchar("prospect_name").notNull(),
  prospectEmail: varchar("prospect_email").notNull(),
  prospectCompany: varchar("prospect_company"),
  customContent: jsonb("custom_content"),
  isActive: boolean("is_active").default(true),
  accessCode: varchar("access_code", { length: 50 }).unique(), // Unique access code for user registration
  welcomeMessage: text("welcome_message"), // Custom welcome message for new users
  views: integer("views").default(0),
  lastAccessed: timestamp("last_accessed"),
  createdBy: varchar("created_by").references(() => users.id),
  teamId: varchar("team_id"),
  sharedWith: text("shared_with").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User invitations for access code registration
export const userInvitations = pgTable("user_invitations", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  siteId: uuid("site_id").notNull().references(() => sites.id),
  accessCode: varchar("access_code", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, registered, verified
  verificationToken: text("verification_token"),
  registeredUserId: varchar("registered_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  registeredAt: timestamp("registered_at"),
  verifiedAt: timestamp("verified_at"),
});

// Content library for uploads
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'image', 'document', 'video', etc.
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Site analytics
export const siteViews = pgTable("site_views", {
  id: serial("id").primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

// Prospects management
export const prospects = pgTable("prospects", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default('active').notNull(),
  siteId: uuid("site_id").references(() => sites.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File storage for uploads
export const files = pgTable("files", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: text("file_path").notNull(),
  category: varchar("category", { length: 100 }).default('general'),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTemplate = typeof templates.$inferInsert;
export type Template = typeof templates.$inferSelect;

export type InsertSite = typeof sites.$inferInsert;
export type Site = typeof sites.$inferSelect;

export type InsertContentItem = typeof contentItems.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;

export type InsertSiteView = typeof siteViews.$inferInsert;
export type SiteView = typeof siteViews.$inferSelect;

export type InsertProspect = typeof prospects.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;

export type InsertUserInvitation = typeof userInvitations.$inferInsert;
export type UserInvitation = typeof userInvitations.$inferSelect;

export type InsertFile = typeof files.$inferInsert;
export type File = typeof files.$inferSelect;

// Insert schemas
export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  lastAccessed: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
});

export const insertSiteViewSchema = createInsertSchema(siteViews).omit({
  id: true,
  viewedAt: true,
});
