import { createBot, Bot } from "mineflayer";
import { Config } from "./config";

export class Agent {
    /**
     * Accumulates rewards for the agent. When this reward is sent to the
     * client over WS, it gets set back to 0.
     */
    protected rewardSinceLastUpdate: number = 0;

    /**
     * Generic information used by all experiments.
     */
    constructor(public bot: Bot) {
        //
    }

    /**
     * Closes the connection.
     */
    public close() {
        this.bot.quit();
    }

    /**
     * Returns the accumulated reward since last time this method was called.
     */
    public getRewardSinceLastUpdateAndReset(): number {
        const reward = this.rewardSinceLastUpdate;
        this.rewardSinceLastUpdate = 0;
        return reward;
    }

    /**
     * Since sometimes when a bot connects it fails to be spawned for an unknown
     * reason, we retry the connection several times.
     */
    public static async spawnBot(
        config: Config,
        username: string
    ): Promise<Bot> {
        for (
            let attempt = 0;
            attempt < config.maxMcConnectionRetries;
            attempt++
        ) {
            // let's sleep for a second as we've just quit the game
            if (attempt !== 0) {
                console.log(`Retrying connection with '${username}'`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const bot = createBot({
                host: config.mcAddr.host,
                port: config.mcAddr.port,
                username,
            });

            try {
                return await new Promise((resolve, reject) => {
                    bot.addListener("spawn", () => {
                        console.log(`Player ${bot.username} ready`);
                        resolve(bot);
                    });

                    setTimeout(
                        () => reject(`Spawn timeout for ${username}`),
                        config.waitForBotSpawnMs
                    );
                });
            } catch {
                bot.quit("Cannot spawn");
            }
        }

        throw new Error("Cannot spawn a new player on the server");
    }
}
