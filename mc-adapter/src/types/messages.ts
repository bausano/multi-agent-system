export interface ClientMessage {
    init?: InitPayload;
}

export interface InitPayload {
    host: string;
    port: number;
    username: string;
    behavior: Behavior;
}

export type Behavior = "hit-and-run";

export interface ServerMessage {
    error?: {
        reason: string;
    };
    ok?: {};
}
