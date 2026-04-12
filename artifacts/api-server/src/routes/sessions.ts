import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, respondentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateSessionBody,
  GetSessionParams,
  SaveSensorDataParams,
  SaveSensorDataBody,
} from "@workspace/api-zod";
import { deviceState } from "./iot";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const sessions = await db
    .select({
      id: sessionsTable.id,
      respondentId: sessionsTable.respondentId,
      sessionNumber: sessionsTable.sessionNumber,
      state: sessionsTable.state,
      mq3AlcoholPpm: sessionsTable.mq3AlcoholPpm,
      mq4MethanePpm: sessionsTable.mq4MethanePpm,
      mq138AcetonePpm: sessionsTable.mq138AcetonePpm,
      tgs2602Voc: sessionsTable.tgs2602Voc,
      samplesCount: sessionsTable.samplesCount,
      createdAt: sessionsTable.createdAt,
      completedAt: sessionsTable.completedAt,
      respondent: {
        id: respondentsTable.id,
        name: respondentsTable.name,
        age: respondentsTable.age,
        gender: respondentsTable.gender,
        status: respondentsTable.status,
        createdAt: respondentsTable.createdAt,
      },
    })
    .from(sessionsTable)
    .innerJoin(respondentsTable, eq(sessionsTable.respondentId, respondentsTable.id))
    .orderBy(desc(sessionsTable.createdAt));
  res.json(sessions);
});

router.post("/", async (req, res) => {
  const body = CreateSessionBody.parse(req.body);

  const respondent = await db
    .select()
    .from(respondentsTable)
    .where(eq(respondentsTable.id, body.respondentId))
    .limit(1);

  if (!respondent[0]) {
    res.status(404).json({ error: "Respondent not found" });
    return;
  }

  const existingSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.respondentId, body.respondentId));

  const sessionNumber = existingSessions.length + 1;

  const [session] = await db
    .insert(sessionsTable)
    .values({
      respondentId: body.respondentId,
      sessionNumber,
      state: "pending",
    })
    .returning();

  deviceState.pendingCommand = {
    command: "start_session",
    sessionId: session.id,
    purgeDuration: 10,
    sampleDuration: 5,
  };

  res.status(201).json(session);
});

router.get("/:id", async (req, res) => {
  const { id } = GetSessionParams.parse(req.params);
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(session);
});

router.post("/:id/sensor-data", async (req, res) => {
  const { id } = SaveSensorDataParams.parse(req.params);
  const body = SaveSensorDataBody.parse(req.body);

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [updated] = await db
    .update(sessionsTable)
    .set({
      mq3AlcoholPpm: body.mq3AlcoholPpm,
      mq4MethanePpm: body.mq4MethanePpm,
      mq138AcetonePpm: body.mq138AcetonePpm,
      tgs2602Voc: body.tgs2602Voc,
      samplesCount: body.samplesCount,
      state: "completed",
      completedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id))
    .returning();

  deviceState.pendingCommand = { command: "idle", sessionId: null, purgeDuration: null, sampleDuration: null };

  res.json(updated);
});

export default router;
