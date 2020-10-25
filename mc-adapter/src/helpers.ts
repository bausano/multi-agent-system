import { ServerMessage } from "./types/messages";

export function errorMsg(reason: string): ServerMessage {
    return { error: { reason } };
}

export function okMsg(): ServerMessage {
    return { ok: {} };
}
