export interface ClientMessage {
    init?: InitPayload;
}

export interface InitPayload {
    host: string;
    port: number;
    username: string;
    behavior: Behavior;
}

export type Behavior = "run-and-hit";

export interface ServerMessage {
    error?: {
        reason: string;
    };
    ok?: {};
}
