import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "reviewed",
  "archived",
]);

export const clinicStatusEnum = pgEnum("clinic_status", [
  "new",
  "contacted",
  "onboarded",
  "archived",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "active",
  "unsubscribed",
]);

export const employmentApplications = pgTable("employment_applications", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  referralSource: varchar("referral_source", { length: 50 }),
  willingToRelocate: varchar("willing_to_relocate", { length: 10 }),
  resumeUrl: text("resume_url"),
  resumeFilename: varchar("resume_filename", { length: 255 }),
  status: applicationStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clinicSignups = pgTable("clinic_signups", {
  id: serial("id").primaryKey(),
  clinicName: varchar("clinic_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  npiNumber: varchar("npi_number", { length: 20 }),
  state: varchar("state", { length: 50 }),
  specialty: varchar("specialty", { length: 100 }),
  message: text("message"),
  status: clinicStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailSignups = pgTable("email_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: emailStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmploymentApplication = typeof employmentApplications.$inferSelect;
export type NewEmploymentApplication = typeof employmentApplications.$inferInsert;
export type ClinicSignup = typeof clinicSignups.$inferSelect;
export type NewClinicSignup = typeof clinicSignups.$inferInsert;
export type EmailSignup = typeof emailSignups.$inferSelect;
export type NewEmailSignup = typeof emailSignups.$inferInsert;
