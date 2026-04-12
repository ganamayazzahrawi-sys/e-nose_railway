import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const respondentsTable = pgTable("respondents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  status: text("status", { enum: ["diabetes", "non-diabetes"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRespondentSchema = createInsertSchema(respondentsTable).omit({ id: true, createdAt: true });
export type InsertRespondent = z.infer<typeof insertRespondentSchema>;
export type Respondent = typeof respondentsTable.$inferSelect;
