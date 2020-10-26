import { Connection } from "./types/Connection";
import { Behavior } from "./types/messages";
import { createBot, Bot } from "mineflayer";

// How long we wait before we consider an attempt to fail.
const RETRY_TIMEOUT_MS = 10000;
// How many times at most we retry before returning an error.
const MAX_RETRIES = 3;

export async function createNewConnection(
    host: string,
    port: number,
    username: string,
    behavior: Behavior
): Promise<Connection> {
    const bot = await spawnBot(host, port, username);

    // FIXME: When this gets large get rid of switch and move to separate dir.
    switch (behavior) {
        case "run-and-hit-ocelot":
            bot.setControlState("forward", true);
            bot.setControlState("sneak", true);
            // Hits closest ocelot. We pick ocelot because they by default run
            // away from the player and are swift.
            // FIXME: Clear the interval once it
            const HIT_OCELOT_INTERVAL = 1000;
            const hitInterval = setInterval(() => {
                try {
                    const nearestEntity = (bot as any).nearestEntity(
                        ({ name }) => name === "ocelot"
                    );
                    if (nearestEntity) {
                        bot.attack(nearestEntity);
                    }
                } catch {
                    console.log(
                        `Stopping run-and-hit-ocelot behavior for ${username} due to lost connection.`
                    );
                    clearInterval(hitInterval);
                }
            }, HIT_OCELOT_INTERVAL);
            break;
        default:
            throw new Error(`Behavior '${behavior}' doesn't exist.`);
    }

    return new Connection(bot, host, port);
}

/**
 * Since sometimes when a bot connects it fails to be spawned for an unknown
 * reason, we retry the connection several times.
 */
export async function spawnBot(
    host: string,
    port: number,
    username: string
): Promise<Bot> {
    for (let i = 0; i < MAX_RETRIES; i++) {
        if (i > 0) {
            // Let's sleep for a second as we've just quit the game.
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const bot = createBot({
            host,
            port,
            username,
        });

        try {
            return await new Promise((resolve, reject) => {
                bot.addListener("spawn", () => {
                    console.log(`Player ${bot.username} ready.`);
                    resolve(bot);
                });

                setTimeout(
                    () => reject(`Spawn timeout for ${username}`),
                    RETRY_TIMEOUT_MS
                );
            });
        } catch {
            bot.quit("Cannot spawn.");
        }
    }

    throw new Error("Cannot spawn a new player on the server.");
}
