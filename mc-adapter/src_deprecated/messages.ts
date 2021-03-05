
export interface StatePayload {
    // How much was the bot rewarded since the last time state was observed.
    reward: number;

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
