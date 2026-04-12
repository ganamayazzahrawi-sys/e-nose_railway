import { Router, type IRouter } from "express";
import {
  UpdateDeviceStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

type CommandType = "idle" | "start_session" | "purge" | "sample" | "stop";
type DeviceStateType = "idle" | "purging" | "ready" | "sampling" | "completed" | "error";

interface PendingCommand {
  command: CommandType;
  sessionId: number | null;
  purgeDuration: number | null;
  sampleDuration: number | null;
}

export const deviceState: {
  pendingCommand: PendingCommand;
  state: DeviceStateType;
  sessionId: number | null;
  message: string | null;
  lastSeen: Date | null;
} = {
  pendingCommand: { command: "idle", sessionId: null, purgeDuration: null, sampleDuration: null },
  state: "idle",
  sessionId: null,
  message: null,
  lastSeen: null,
};

const ONLINE_THRESHOLD_MS = 15000;

router.get("/command", (_req, res) => {
  deviceState.lastSeen = new Date();
  res.json(deviceState.pendingCommand);
});

router.get("/status", (_req, res) => {
  const isOnline =
    deviceState.lastSeen !== null &&
    Date.now() - deviceState.lastSeen.getTime() < ONLINE_THRESHOLD_MS;

  res.json({
    state: deviceState.state,
    sessionId: deviceState.sessionId,
    message: deviceState.message,
    lastSeen: deviceState.lastSeen?.toISOString() ?? null,
    isOnline,
  });
});

router.post("/status", (req, res) => {
  const body = UpdateDeviceStatusBody.parse(req.body);
  deviceState.lastSeen = new Date();
  deviceState.state = body.state;
  deviceState.sessionId = body.sessionId ?? null;
  deviceState.message = body.message ?? null;

  if (body.state !== "idle" && deviceState.pendingCommand.command === "start_session") {
    deviceState.pendingCommand = { command: "idle", sessionId: null, purgeDuration: null, sampleDuration: null };
  }

  const isOnline = true;

  res.json({
    state: deviceState.state,
    sessionId: deviceState.sessionId,
    message: deviceState.message,
    lastSeen: deviceState.lastSeen.toISOString(),
    isOnline,
  });
});

export default router;
