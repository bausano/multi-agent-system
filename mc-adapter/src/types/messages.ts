export interface ClientMessage {
    init?: InitPayload;
}

export interface InitPayload {
    host: string;
    port: number;
    username: string;
    behavior: Behavior;
}

export type Behavior = "run-and-hit-ocelot";

export interface ServerMessage {
    error?: {
        reason: string;
    };
    ok?: {};
    state?: StatePayload;
}

export interface StatePayload {
    // 9 numbers around the bot, each number is either 1 or 0. Each index
    // corresponds to a wall being around a bot on certain position. The
    // position does not change with orientation.
    //
    // +---|---|---+
    // | 0 | 1 | 2 |
    // +---|---|---+
    // | 3 | 4 | 5 |
    // +---|---|---+
    // | 6 | 7 | 8 |
    // +---|---|---+
    walls: number[];

    // Each entity is a list of numbers which characterize it. The list contains
    // stuff like health, velocity, position, hashed username, ...
    //
    // There's a set limit on how many entities there should be. The list can
    // be less than the provided number, never more.
    // FIXME: Consider getting this settings from the client and then pad with
    // zeros.
    entities: number[][];
}
