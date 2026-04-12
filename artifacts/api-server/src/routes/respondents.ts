import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { respondentsTable, sessionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateRespondentBody,
  GetRespondentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const respondents = await db
    .select()
    .from(respondentsTable)
    .orderBy(desc(respondentsTable.createdAt));
  res.json(respondents);
});

router.post("/", async (req, res) => {
  const body = CreateRespondentBody.parse(req.body);
  const [respondent] = await db
    .insert(respondentsTable)
    .values(body)
    .returning();
  res.status(201).json(respondent);
});

router.get("/:id", async (req, res) => {
  const { id } = GetRespondentParams.parse(req.params);
  const respondent = await db
    .select()
    .from(respondentsTable)
    .where(eq(respondentsTable.id, id))
    .limit(1);

  if (!respondent[0]) {
    res.status(404).json({ error: "Respondent not found" });
    return;
  }

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.respondentId, id))
    .orderBy(desc(sessionsTable.createdAt));

  res.json({ ...respondent[0], sessions });
});

export default router;
