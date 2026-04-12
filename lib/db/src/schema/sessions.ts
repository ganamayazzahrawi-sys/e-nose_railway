import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { respondentsTable } from "./respondents";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  respondentId: integer("respondent_id").notNull().references(() => respondentsTable.id),
  sessionNumber: integer("session_number").notNull().default(1),
  state: text("state", {
    enum: ["pending", "purging", "ready", "sampling", "completed", "error"],
  }).notNull().default("pending"),
  mq3AlcoholPpm: real("mq3_alcohol_ppm"),
  mq4MethanePpm: real("mq4_methane_ppm"),
  mq138AcetonePpm: real("mq138_acetone_ppm"),
  tgs2602Voc: real("tgs2602_voc"),
  samplesCount: integer("samples_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
