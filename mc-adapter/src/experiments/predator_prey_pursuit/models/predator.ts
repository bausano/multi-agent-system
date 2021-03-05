import { Agent } from "@/models/agent";
import { Config } from "@/models/config";

export class Predator extends Agent {
    /**
     * Connects to the Minecraft server and sets the bot to:
     * - always walk forward
     * - walk slowly
     * - be rewarded for ocelot death
     * - automatically hit nearest ocelot
     */
    public static async spawn(
        config: Config,
        username: string
    ): Promise<Predator> {
        const bot = await Agent.spawnBot(config, username);
        const predator = new Predator(bot);

        // if an ocelot dies, which is our prey, then check how far away the
        // predator was and award reward based on that
        bot.on("entityGone", (entity) => {
            if (entity.name !== "ocelot") {
                return;
            }

            const { x, z } = entity.position;
            predator.preyDiedInProximity(x, z);
        });

        // the predator goes always forward, and the ML only controls where
        // the camera points
        bot.setControlState("forward", true);
        // make the predators much slower than the ocelots
        bot.setControlState("sneak", true);

        // hits closest ocelot once a second
        const HIT_OCELOT_INTERVAL_MS = 1000;
        const hitInterval = setInterval(() => {
            try {
                // unfortunately types don't know about this method
                const nearestEntity = (bot as any).nearestEntity(
                    ({ name }) => name === "ocelot"
                );
                if (nearestEntity) {
                    bot.attack(nearestEntity);
                }
            } catch {
                console.log(
                    `Stopping behavior for ${username} due to lost connection.`
                );
                clearInterval(hitInterval);
            }
        }, HIT_OCELOT_INTERVAL_MS);

        return predator;
    }

    /**
     * We reward bots based on how far away they are from a prey kill.
     */
    public preyDiedInProximity(preyX: number, preyZ: number) {
        const { x: botX, z: botZ } = this.bot.entity.position;
        const sqDist = Math.pow(preyX - botX, 2) + Math.pow(preyZ - botZ, 2);

        // the closer to the ocelot's death point, the more reward
        if (sqDist < 9) {
            this.rewardSinceLastUpdate += 3;
        } else if (sqDist < 16) {
            this.rewardSinceLastUpdate += 2;
        } else if (sqDist < 25) {
            this.rewardSinceLastUpdate += 1;
        }
    }
}
